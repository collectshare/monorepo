import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3Client } from '@infra/clients/s3Client';
import { Injectable } from '@kernel/decorators/Injectable';
import { AppConfig } from '@shared/config/AppConfig';
import { minutesToSeconds } from '@shared/utils/minutesToSeconds';

@Injectable()
export class StorageGateway {
  constructor(private readonly appConfig: AppConfig) { }

  async getSignedUrl(key: string) {
    const command = new GetObjectCommand({
      Key: key,
      Bucket: this.appConfig.storage.mainBucket,
    });

    return getSignedUrl(s3Client, command, {
      expiresIn: minutesToSeconds(15),
    });
  }
}
