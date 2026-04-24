import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import * as jwksRsa from 'jwks-rsa';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private config: ConfigService,
    @InjectModel('User') private userModel: Model<any>,
  ) {
    const keycloakUrl = config.get<string>('KEYCLOAK_URL') ?? '';
    const realm = config.get<string>('REALM') ?? '';
    const issuer = `${keycloakUrl}/realms/${realm}`;
    const jwksUri = `${keycloakUrl}/realms/${realm}/protocol/openid-connect/certs`;

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      audience: 'account',
      issuer,
      algorithms: ['RS256'],
      secretOrKeyProvider: jwksRsa.passportJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri,
      }),
    });
  }

  async validate(payload: any) {
    // Fetch MongoDB user by keycloakId to include mongoId and role in request
    const mongoUser = await this.userModel.findOne({ keycloakId: payload.sub });
    
    // Determine role with fallback for bootstrap admin
    let role = mongoUser?.role || null;
    if (!role && (payload.preferred_username === 'admin' || payload.preferred_username === 'Admin')) {
      role = 'SUPER_ADMIN';
    }

    return {
      ...payload,
      mongoId: mongoUser?._id?.toString() || payload.sub,
      role,
      email: mongoUser?.email || payload.email,
      username: mongoUser?.username || payload.preferred_username,
    };
  }
}
