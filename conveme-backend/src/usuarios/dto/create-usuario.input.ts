import { InputType, Int, Field } from '@nestjs/graphql';
import { IsString, IsOptional, IsInt, IsUrl } from 'class-validator';

@InputType()
export class CreateUsuarioInput {
    @Field()
    @IsString()
    username: string;

    @Field()
    @IsString()
    password_raw: string;

    @Field(() => Int, { nullable: true })
    @IsOptional()
    @IsInt()
    rol_id?: number;

    @Field({ nullable: true })
    @IsOptional()
    @IsString()
    foto_perfil?: string;

    @Field({ nullable: true })
    @IsOptional()
    @IsString()
    push_token?: string;
}
