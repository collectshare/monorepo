import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';

const tableName = process.env.MAIN_TABLE_NAME;

if (!tableName) {
  throw new Error('MAIN_TABLE_NAME is not set');
}

const dynamoClient = DynamoDBDocumentClient.from(new DynamoDBClient());

async function backfillFormIsPublished(): Promise<void> {
  let exclusiveStartKey: Record<string, unknown> | undefined;
  let scanned = 0;
  let updated = 0;

  do {
    const { Items = [], LastEvaluatedKey } = await dynamoClient.send(
      new ScanCommand({
        TableName: tableName,
        FilterExpression: '#type = :type AND attribute_not_exists(isPublished)',
        ExpressionAttributeNames: { '#type': 'type' },
        ExpressionAttributeValues: { ':type': 'Form' },
        ExclusiveStartKey: exclusiveStartKey,
      }),
    );

    scanned += Items.length;

    for (const item of Items) {
      await dynamoClient.send(
        new UpdateCommand({
          TableName: tableName,
          Key: { PK: item.PK, SK: item.SK },
          UpdateExpression: 'SET isPublished = :isPublished',
          ExpressionAttributeValues: { ':isPublished': true },
        }),
      );
      updated += 1;
    }

    exclusiveStartKey = LastEvaluatedKey;
  } while (exclusiveStartKey);

  console.log(`Backfill complete. Forms missing isPublished found: ${scanned}. Updated: ${updated}.`);
}

backfillFormIsPublished().catch((error) => {
  console.error('Backfill failed', error);
  process.exit(1);
});
