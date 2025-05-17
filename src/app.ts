import { ExpressServer } from "./infrastructure/servers/express.server";

//validacion de variables de entorno
if (!process.env.NODE_ENV) {
  console.log("NODE_ENV no definido, se usara desarrollo por defecto");
}

const server = new ExpressServer();
server.start();
