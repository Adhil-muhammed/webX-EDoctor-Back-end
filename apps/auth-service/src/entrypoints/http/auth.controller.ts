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
