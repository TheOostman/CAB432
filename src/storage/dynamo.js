// src/storage/dynamo.js
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, GetCommand } from "@aws-sdk/lib-dynamodb";

const REGION = process.env.AWS_REGION || "ap-southeast-2";
const JOBS_TABLE = process.env.DDB_JOBS_TABLE || "cab432-jobs";
const DOCS_TABLE = process.env.DDB_DOCS_TABLE || "cab432-docs";

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({ region: REGION }));

export async function putJob(job) {
  await ddb.send(new PutCommand({ TableName: JOBS_TABLE, Item: job }));
  return job;
}

export async function putDoc(doc) {
  await ddb.send(new PutCommand({ TableName: DOCS_TABLE, Item: doc }));
  return doc;
}

export async function getJob(id) {
  const res = await ddb.send(new GetCommand({ TableName: JOBS_TABLE, Key: { id } }));
  return res.Item ?? null;
}
