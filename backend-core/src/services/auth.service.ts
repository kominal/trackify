import { Injectable } from '@nestjs/common';
import { decode, verify } from 'jsonwebtoken';
import { JwksClient } from 'jwks-rsa';

@Injectable()
export class AuthService {
  private jwksClient = new JwksClient({ jwksUri: 'https://climate-resilience-suite.eu.auth0.com/.well-known/jwks.json' });

  public async getClaims(bearerHeader: string): Promise<any> {
    if (!bearerHeader) {
      return undefined;
    }

    const token = bearerHeader.split(' ')[1];

    const decodedToken = decode(token, { complete: true });

    if (!decodedToken) {
      return undefined;
    }

    const publicKey = await this.jwksClient.getSigningKey(decodedToken.header.kid).then((key) => key.getPublicKey());

    return verify(token, publicKey);
  }
}
