import { Socket } from "net";
import { TLSSocket } from "tls";
const TIMEOUT = 10000;

export class TCPSocketClient {
  host: any;
  port: any;
  client: Socket;
  constructor(self, host, port, protocol, options) {
    let conn;
    switch (protocol) {
      case "tcp":
        conn = new Socket();
        break;
      case "tls":
      case "ssl":
        conn = new TLSSocket(options);
        break;
      default:
        throw new Error("not supported protocol" + protocol);
    }
    this.host = host;
    this.port = port;
    initialize(self, conn);
    this.client = conn;
  }

  async connect() {
    const client = this.client;

    return new Promise((resolve, reject) => {
      const onConnect = () => {
        client.removeListener('error', onError);
        resolve(true);
      };
      const onError = (err: Error) => {
        client.removeListener('connect', onConnect);
        reject(err);
      }
      // Use once to automatically remove the listener after it fires
      client.once('connect', onConnect);
      client.once('error', onError);
      client.connect(this.port, this.host);
    });
  }

  async close() {
    this.client.end();
    this.client.destroy();
  }

  send(data) {
    this.client.write(data);
  }
}

function initialize(self, conn) {
  conn.setTimeout(TIMEOUT);
  conn.setEncoding("utf8");
  conn.setKeepAlive(true, 0);
  conn.setNoDelay(true);

  conn.on("connect", () => {
    conn.setTimeout(0);
    self.onConnect();
  });

  conn.on("close", (e) => {
    self.onClose(e);
  });

  conn.on("timeout", () => {
    const e = new Error("ETIMEDOUT");
    conn.emit("error", e);
  });

  conn.on("data", (chunk) => {
    conn.setTimeout(0);
    self.onRecv(chunk);
  });

  conn.on("end", (e) => {
    conn.setTimeout(0);
    self.onEnd(e);
  });

  conn.on("error", (e) => {
    self.onError(e);
  });
}
