import { InputType, Field } from '@nestjs/graphql';
import { IsString, MinLength } from 'class-validator';

@InputType()
export class LoginInput {
    @Field()
    @IsString()
    username: string;

    @Field()
    @IsString()
    @MinLength(1)
    password_raw: string;
}
