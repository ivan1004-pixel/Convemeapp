import { InputType, Field, Int, PartialType } from '@nestjs/graphql';
import { IsInt, IsOptional, IsString, IsBoolean } from 'class-validator';
import { CreateUsuarioInput } from './create-usuario.input';

@InputType()
export class UpdateUsuarioInput extends PartialType(CreateUsuarioInput) {
    @Field(() => Int)
    @IsInt()
    id_usuario: number;

    @Field({ nullable: true })
    @IsOptional()
    @IsString()
    username?: string;

    @Field({ nullable: true })
    @IsOptional()
    @IsString()
    password_raw?: string;

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

    @Field({ nullable: true })
    @IsOptional()
    @IsBoolean()
    activo?: boolean;
}
