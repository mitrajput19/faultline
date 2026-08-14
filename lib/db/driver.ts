import neo4j, { Driver, Session } from "neo4j-driver";

/**
 * Raised for every failure that leaves the application unable to read from
 * CognoDB: missing configuration, DNS/TLS failure, auth failure or timeout.
 * Pages catch this and render a recoverable state instead of crashing.
 */
export class DatabaseUnavailableError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "DatabaseUnavailableError";
  }
}

// Next.js replaces module instances on hot reload, so the driver is cached on
// globalThis to avoid leaking a connection pool per edit in development.
const globalForDriver = globalThis as unknown as { faultlineDriver?: Driver };

function createDriver(): Driver {
  const uri = process.env.COGNODB_URI;
  const user = process.env.COGNODB_USER;
  const password = process.env.COGNODB_PASSWORD;

  if (!uri || !user || !password) {
    throw new DatabaseUnavailableError(
      "COGNODB_URI, COGNODB_USER and COGNODB_PASSWORD must be set.",
    );
  }

  return neo4j.driver(uri, neo4j.auth.basic(user, password), {
    // The free c0 instance allows 200 connections; stay well inside that.
    maxConnectionPoolSize: 20,
    connectionAcquisitionTimeout: 10_000,
    connectionTimeout: 10_000,
    // Return graph integers as JS numbers. Every count and hop depth in this
    // application is far below Number.MAX_SAFE_INTEGER.
    disableLosslessIntegers: true,
  });
}

function getDriver(): Driver {
  if (!globalForDriver.faultlineDriver) {
    globalForDriver.faultlineDriver = createDriver();
  }
  return globalForDriver.faultlineDriver;
}

/**
 * Runs a parameterised read query and returns plain objects.
 * Cypher is always passed as a static string with `$parameters`; values are
 * never interpolated into the query text.
 */
export async function read<T>(
  cypher: string,
  parameters: Record<string, unknown> = {},
): Promise<T[]> {
  let session: Session | undefined;

  try {
    session = getDriver().session({ defaultAccessMode: neo4j.session.READ });
    const result = await session.run(cypher, parameters);
    return result.records.map((record) => record.toObject() as T);
  } catch (error) {
    if (error instanceof DatabaseUnavailableError) {
      throw error;
    }
    throw new DatabaseUnavailableError(
      "Could not reach the CognoDB instance.",
      { cause: error },
    );
  } finally {
    await session?.close();
  }
}
