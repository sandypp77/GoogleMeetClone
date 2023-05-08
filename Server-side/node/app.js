const express = require("express");
var history = require("connect-history-api-fallback");

const app = express();
app.use(history());
const https = require("httpolyglot");
const fs = require("fs");
const mediasoup = require("mediasoup");
const config = require("./config");
const path = require("path");
const Room = require("./Room");
const Peer = require("./Peer");
const { v4: uuidv4, v4 } = require("uuid");

const options = {
  key: fs.readFileSync(path.join(__dirname, config.sslKey), "utf-8"),
  cert: fs.readFileSync(path.join(__dirname, config.sslCrt), "utf-8"),
};

const httpsServer = https.createServer(options, app);
const io = require("socket.io")(httpsServer);

app.use(
  "/",
  express.static(
    path.join(__dirname, "../../Client-side/google-meet-clone", "dist")
  )
);

httpsServer.listen(config.listenPort, () => {
  console.log(
    "Listening on https://" + config.listenIp + ":" + config.listenPort
  );
});

// all mediasoup workers
let workers = [];
let nextMediasoupWorkerIdx = 0;
let users = new Map();
let usersList = [];

/**
 * roomList
 * {
 *  room_id: Room {
 *      id:
 *      router:
 *      peers: {
 *          id:,
 *          name:,
 *          master: [boolean],
 *          transports: [Map],
 *          producers: [Map],
 *          consumers: [Map],
 *          rtpCapabilities:
 *      }
 *  }
 * }
 */
let roomList = new Map();

(async () => {
  await createWorkers();
})();

// create worker amd check how many worker can be build
async function createWorkers() {
  let { numWorkers } = config.mediasoup;

  for (let i = 0; i < numWorkers; i++) {
    let worker = await mediasoup.createWorker({
      logLevel: config.mediasoup.worker.logLevel,
      logTags: config.mediasoup.worker.logTags,
      rtcMinPort: config.mediasoup.worker.rtcMinPort,
      rtcMaxPort: config.mediasoup.worker.rtcMaxPort,
    });

    worker.on("died", () => {
      console.error(
        "mediasoup worker died, exiting in 2 seconds... [pid:%d]",
        worker.pid
      );
      setTimeout(() => process.exit(1), 2000);
    });
    workers.push(worker);

    // log worker resource usage
    /*setInterval(async () => {
            const usage = await worker.getResourceUsage();

            console.info('mediasoup Worker resource usage [pid:%d]: %o', worker.pid, usage);
        }, 120000);*/
  }
}

//socket connection
io.on("connection", (socket) => {
  //create room -> connected with room.js
  socket.on("createRoom", async ({ room_id }, callback) => {
    if (roomList.has(room_id)) {
      callback("already exists");
    } else {
      console.log("Created room", { room_id: room_id });
      let worker = await getMediasoupWorker(); // get worker
      roomList.set(room_id, new Room(room_id, worker, io)); //generate router in room.js
      callback(room_id);
    }
  });

  //connection join into room -> peer.js
  socket.on("join", async ({ room_id, name }, cb) => {
    console.log("User joined", {
      room_id: room_id,
      name: name,
    });

    if (!roomList.has(room_id)) {
      return cb({
        error: "Room does not exist",
      });
    }
    const usersId = uuidv4();
    users.set(name, usersId);
    usersList.push({
      username: name,
      room_id: room_id,
    });
    socket.emit("usersList", usersList);
    //add peer in room.js -> parameter(new peer(socket.id, name)) -> peer.js
    roomList.get(room_id).addPeer(new Peer(socket.id, name, usersId));
    socket.room_id = room_id;
    cb(roomList.get(room_id).toJson()); //callback to json -> function from room.js
  });

  socket.on("getProducers", () => {
    if (!roomList.has(socket.room_id)) return;
    console.log("Get Producers", {
      name: `${roomList.get(socket.room_id).getPeers().get(socket.id).name}`,
    });

    //send all the current producer to newly joined member
    let producerList = roomList.get(socket.room_id).getProducerListForPeer();
    console.log("ProducerList", producerList);
    socket.emit("newProducers", producerList);
  });

  socket.on("getRouterRtpCapabilities", (_, callback) => {
    console.log("Get RouterRtpCapabilities", {
      name: `${roomList.get(socket.room_id).getPeers().get(socket.id).name}`,
    });

    try {
      callback(roomList.get(socket.room_id).getRtpCapabilities());
    } catch (e) {
      callback({
        error: e.message,
      });
    }
  });

  socket.on("createWebRtcTransport", async (_, callback) => {
    console.log("Create webrtc transport", {
      name: `${roomList.get(socket.room_id).getPeers().get(socket.id).name}`,
    });

    try {
      const { params } = await roomList
        .get(socket.room_id)
        .createWebRtcTransport(socket.id);

      callback(params);
    } catch (err) {
      console.error(err);
      callback({
        error: err.message,
      });
    }
  });

  socket.on(
    "connectTransport",
    async ({ transport_id, dtlsParameters }, callback) => {
      console.log("Connect transport", {
        name: `${roomList.get(socket.room_id).getPeers().get(socket.id).name}`,
      });

      if (!roomList.has(socket.room_id)) return;
      await roomList
        .get(socket.room_id)
        .connectPeerTransport(socket.id, transport_id, dtlsParameters);

      callback("success");
    }
  );

  socket.on(
    "produce",
    async ({ kind, rtpParameters, producerTransportId, type }, callback) => {
      if (!roomList.has(socket.room_id)) {
        return callback({ error: "not is a room" });
      }

      let producer_id = await roomList
        .get(socket.room_id)
        .produce(socket.id, producerTransportId, rtpParameters, kind, type);

      console.log("Produce", {
        type: `${kind}`,
        name: `${roomList.get(socket.room_id).getPeers().get(socket.id).name}`,
        id: `${producer_id}`,
      });

      callback({
        producer_id,
      });
    }
  );

  socket.on(
    "consume",
    async ({ consumerTransportId, producerId, rtpCapabilities }, callback) => {
      //TODO null handling
      let params = await roomList
        .get(socket.room_id)
        .consume(socket.id, consumerTransportId, producerId, rtpCapabilities);

      console.log("Consuming", {
        name: `${
          roomList.get(socket.room_id) &&
          roomList.get(socket.room_id).getPeers().get(socket.id).name
        }`,
        producer_id: `${producerId}`,
        consumer_id: `${params.id}`,
      });
      io.emit("newJoined");
      socket.emit("usersList", usersList);
      callback(params);
    }
  );

  socket.on("resume", async (data, callback) => {
    await consumer.resume();
    callback();
  });

  socket.on("message", (data) => {
    socket.broadcast.emit("message:received", data);
  });

  socket.on("getMyRoomInfo", (_, cb) => {
    cb(roomList.get(socket.room_id).toJson());
  });

  socket.on("disconnect", () => {
    try {
      let usersId = users.get(
        roomList.get(socket.room_id).getPeers().get(socket.id).name
      );
      socket.broadcast.emit("exitUser", usersId);
      users.delete(roomList.get(socket.room_id).getPeers().get(socket.id).name);
      const index = roomList.get(socket.room_id).getPeers().get(socket.id).name;
      if (usersList.findIndex((element) => element.username === index) > -1) {
        usersList.splice(
          usersList.findIndex((i) => {
            return i.username === index;
          }),
          1
        );
        socket.broadcast.emit("usersList", usersList);
        const listener = (...args) => {
          console.log(args);
        };
        setInterval(() => {
          socket.off("usersList", listener);
        }, 200);
      }
    } catch (error) {}
    console.log("Disconnect", {
      name: `${
        roomList.get(socket.room_id) &&
        roomList.get(socket.room_id).getPeers().get(socket.id).name
      }`,
    });

    if (!socket.room_id) return;
    roomList.get(socket.room_id).removePeer(socket.id);
  });

  socket.on("producerClosed", ({ producer_id }) => {
    console.log("Producer close", {
      name: `${
        roomList.get(socket.room_id) &&
        roomList.get(socket.room_id).getPeers().get(socket.id).name
      }`,
    });

    roomList.get(socket.room_id).closeProducer(socket.id, producer_id);
  });

  socket.on("exitUser", (value) => {
    socket.broadcast.emit("exitUserCast", value);
  });

  socket.on("exitRoom", async (_, callback) => {
    let usersId = users.get(
      roomList.get(socket.room_id).getPeers().get(socket.id).name
    );
    socket.broadcast.emit("exitUser", usersId);
    users.delete(roomList.get(socket.room_id).getPeers().get(socket.id).name);
    console.log(users);
    const index = roomList.get(socket.room_id).getPeers().get(socket.id).name;
    if (usersList.findIndex((element) => element.username === index) > -1) {
      usersList.splice(
        usersList.findIndex((i) => {
          return i.username === index;
        }),
        1
      );
      socket.broadcast.emit("usersList", usersList);
      const listener = (...args) => {
        console.log(args);
      };
      setInterval(() => {
        socket.off("usersList", listener);
      }, 200);
    }
    console.log("Exit room", {
      name: `${
        roomList.get(socket.room_id) &&
        roomList.get(socket.room_id).getPeers().get(socket.id).name
      }`,
    });

    if (!roomList.has(socket.room_id)) {
      callback({
        error: "not currently in a room",
      });
      return;
    }
    // close transports
    await roomList.get(socket.room_id).removePeer(socket.id);
    if (roomList.get(socket.room_id).getPeers().size === 0) {
      roomList.delete(socket.room_id);
    }

    socket.room_id = null;

    callback("successfully exited room");
  });
});

// TODO remove - never used?
function room() {
  return Object.values(roomList).map((r) => {
    return {
      router: r.router.id,
      peers: Object.values(r.peers).map((p) => {
        return {
          name: p.name,
        };
      }),
      id: r.id,
    };
  });
}

function getMediasoupWorker() {
  const worker = workers[nextMediasoupWorkerIdx];
  if (++nextMediasoupWorkerIdx === workers.length) nextMediasoupWorkerIdx = 0;
  return worker;
}
