cat > src/storage/dynamo.js <<'EOF'
import { DynamoDBClient, PutItemCommand, GetItemCommand, UpdateItemCommand } from "@aws-sdk/client-dynamodb";

const REGION = process.env.AWS_REGION || "ap-southeast-2";
const DDB_DOCS_TABLE = process.env.DDB_DOCS_TABLE;
const DDB_JOBS_TABLE = process.env.DDB_JOBS_TABLE;
if (!DDB_DOCS_TABLE || !DDB_JOBS_TABLE) throw new Error("Missing DDB_DOCS_TABLE or DDB_JOBS_TABLE");

export const ddb = new DynamoDBClient({ region: REGION });

const m = (obj) =>
  Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, typeof v === "number" ? { N: String(v) } : { S: String(v) }]));

export async function putDoc({ docId, owner, name, s3Key, createdAt }) {
  await ddb.send(new PutItemCommand({ TableName: DDB_DOCS_TABLE, Item: m({ docId, owner, name, s3Key, createdAt }) }));
}

export async function putJob({ jobId, owner, docId, status, pages, repeats, s3Key, createdAt }) {
  await ddb.send(new PutItemCommand({ TableName: DDB_JOBS_TABLE, Item: m({ jobId, owner, docId, status, pages, repeats, s3Key, createdAt }) }));
}

export async function getJob(jobId) {
  const out = await ddb.send(new GetItemCommand({ TableName: DDB_JOBS_TABLE, Key: { jobId: { S: jobId } } }));
  return out.Item ? Object.fromEntries(Object.entries(out.Item).map(([k, v]) => [k, v.S ?? (v.N ? Number(v.N) : null)])) : null;
}

export async function updateJobStatus(jobId, status) {
  await ddb.send(new UpdateItemCommand({
    TableName: DDB_JOBS_TABLE,
    Key: { jobId: { S: jobId } },
    UpdateExpression: "SET #s = :s",
    ExpressionAttributeNames: { "#s": "status" },
    ExpressionAttributeValues: { ":s": { S: status } },
  }));
}
EOF
