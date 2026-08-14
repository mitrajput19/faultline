import neo4j from "neo4j-driver";
import { lookup } from "node:dns/promises";

const uri = process.env.COGNODB_URI;
const host = uri.replace(/^bolt\+s:\/\//, "").split(":")[0];

console.log("URI  :", uri);
console.log("HOST :", host);

try {
  const dns = await lookup(host);
  console.log("DNS  : resolves to", dns.address);
} catch (error) {
  console.log("DNS  : FAILED —", error.code, error.message);
}

const driver = neo4j.driver(
  uri,
  neo4j.auth.basic(process.env.COGNODB_USER, process.env.COGNODB_PASSWORD),
  { connectionTimeout: 15000 },
);

try {
  const info = await driver.getServerInfo();
  console.log("BOLT : connected —", info.address, info.protocolVersion);
  const session = driver.session();
  const result = await session.run("MATCH (n) RETURN count(n) AS nodes");
  console.log("QUERY: ok —", result.records[0].get("nodes").toString(), "nodes");
  await session.close();
} catch (error) {
  console.log("BOLT : FAILED");
  console.log("  code :", error.code ?? "(none)");
  console.log("  msg  :", error.message);
  if (error.cause) console.log("  cause:", error.cause.message ?? error.cause);
} finally {
  await driver.close();
}
