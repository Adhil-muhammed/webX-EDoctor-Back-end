import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Inject,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import type {
  OtpResponseDto,
  RefreshTokenDto,
  RequestOtpDto,
  TokenPairDto,
  VerifyOtpDto,
} from '@ente-doctor/contracts';
import {
  InvalidEmailError,
  OtpExpiredError,
  OtpInvalidError,
  OtpMaxAttemptsError,
  RefreshTokenExpiredError,
  RefreshTokenRevokedError,
} from '../../domain/entities/auth.errors';
import type { RefreshTokenUseCase } from '../../domain/use-cases/refresh-token.use-case';
import type { RequestOtpUseCase } from '../../domain/use-cases/request-otp.use-case';
import type { VerifyOtpUseCase } from '../../domain/use-cases/verify-otp.use-case';
import {
  REFRESH_TOKEN_USE_CASE,
  REQUEST_OTP_USE_CASE,
  VERIFY_OTP_USE_CASE,
} from '../../domain/use-cases/use-case-tokens';
import { RequestOtpDto as RequestOtpSwaggerDto } from './swagger-dtos/request-otp.dto';
import { VerifyOtpDto as VerifyOtpSwaggerDto } from './swagger-dtos/verify-otp.dto';
import { RefreshTokenDto as RefreshTokenSwaggerDto } from './swagger-dtos/refresh-token.dto';
import { OtpResponseDto as OtpResponseSwaggerDto } from './swagger-dtos/otp-response.dto';
import { TokenPairDto as TokenPairSwaggerDto } from './swagger-dtos/token-pair.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    @Inject(REQUEST_OTP_USE_CASE)
    private readonly requestOtp: RequestOtpUseCase,
    @Inject(VERIFY_OTP_USE_CASE)
    private readonly verifyOtp: VerifyOtpUseCase,
    @Inject(REFRESH_TOKEN_USE_CASE)
    private readonly refreshToken: RefreshTokenUseCase,
  ) {}

  @Post('otp/request')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Request an OTP', description: 'Sends a one-time password to the given email address.' })
  @ApiBody({ type: RequestOtpSwaggerDto })
  @ApiResponse({ status: 202, description: 'OTP sent successfully.', type: OtpResponseSwaggerDto })
  @ApiResponse({ status: 400, description: 'Invalid email address.' })
  async requestOtpHandler(
    @Body() body: RequestOtpDto,
  ): Promise<OtpResponseDto> {
    try {
      return await this.requestOtp.execute({ email: body.email });
    } catch (err) {
      if (err instanceof InvalidEmailError) {
        throw new BadRequestException(err.message);
      }
      throw err;
    }
  }

  @Post('otp/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify an OTP', description: 'Validates the OTP and returns an access/refresh token pair.' })
  @ApiBody({ type: VerifyOtpSwaggerDto })
  @ApiResponse({ status: 200, description: 'OTP verified — token pair returned.', type: TokenPairSwaggerDto })
  @ApiResponse({ status: 400, description: 'OTP expired, invalid, or max attempts exceeded.' })
  async verifyOtpHandler(@Body() body: VerifyOtpDto): Promise<TokenPairDto> {
    try {
      return await this.verifyOtp.execute({
        email: body.email,
        code: body.code,
      });
    } catch (err) {
      if (
        err instanceof OtpExpiredError ||
        err instanceof OtpInvalidError ||
        err instanceof OtpMaxAttemptsError
      ) {
        throw new BadRequestException(err.message);
      }
      throw err;
    }
  }

  @Post('token/refresh')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Refresh access token', description: 'Issues a new token pair from a valid refresh token.' })
  @ApiBody({ type: RefreshTokenSwaggerDto })
  @ApiResponse({ status: 200, description: 'New token pair issued.', type: TokenPairSwaggerDto })
  @ApiResponse({ status: 401, description: 'Refresh token expired or revoked.' })
  async refreshTokenHandler(
    @Body() body: RefreshTokenDto,
  ): Promise<TokenPairDto> {
    try {
      return await this.refreshToken.execute({
        refreshToken: body.refreshToken,
      });
    } catch (err) {
      if (
        err instanceof RefreshTokenExpiredError ||
        err instanceof RefreshTokenRevokedError
      ) {
        throw new UnauthorizedException(err.message);
      }
      throw err;
    }
  }
}
