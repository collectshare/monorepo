import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';

// Every form is now anonymous and published. Removes the legacy isAnonymous/isPublished
// attributes; the resulting MODIFY makes onFormChanged (re)index the form in Algolia.
const tableName = process.env.MAIN_TABLE_NAME;

if (!tableName) {
  throw new Error('MAIN_TABLE_NAME is not set');
}

const dynamoClient = DynamoDBDocumentClient.from(new DynamoDBClient());

async function cleanupFormFlags(): Promise<void> {
  let exclusiveStartKey: Record<string, unknown> | undefined;
  let updated = 0;

  do {
    const { Items = [], LastEvaluatedKey } = await dynamoClient.send(
      new ScanCommand({
        TableName: tableName,
        FilterExpression: '#type = :type AND (attribute_exists(isPublished) OR attribute_exists(isAnonymous))',
        ExpressionAttributeNames: { '#type': 'type' },
        ExpressionAttributeValues: { ':type': 'Form' },
        ExclusiveStartKey: exclusiveStartKey,
      }),
    );

    for (const item of Items) {
      await dynamoClient.send(
        new UpdateCommand({
          TableName: tableName,
          Key: { PK: item.PK, SK: item.SK },
          UpdateExpression: 'REMOVE isPublished, isAnonymous',
        }),
      );
      updated += 1;
    }

    exclusiveStartKey = LastEvaluatedKey;
  } while (exclusiveStartKey);

  console.log(`Cleanup complete. Forms updated: ${updated}.`);
}

cleanupFormFlags().catch((error) => {
  console.error('Cleanup failed', error);
  process.exit(1);
});
