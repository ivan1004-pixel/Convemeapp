import { Injectable, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
    getRequest(context: ExecutionContext) {
        const ctx = GqlExecutionContext.create(context);
        const req = ctx.getContext().req;
        if (req.headers.authorization) {
            console.log(`[AUTH] Auth header found: ${req.headers.authorization.substring(0, 15)}...`);
        } else {
            console.log('[AUTH] No Auth header found in request');
        }
        return req;
    }
}
