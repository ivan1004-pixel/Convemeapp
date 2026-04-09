import { InputType, Int, Field } from '@nestjs/graphql';
import { IsString, IsOptional, IsInt, IsEmail, IsNotEmpty } from 'class-validator';

@InputType()
export class CreateVendedorInput {
    @Field(() => Int)
    @IsInt()
    @IsNotEmpty()
    usuario_id: number;

    @Field(() => Int, { nullable: true })
    @IsOptional()
    @IsInt()
    escuela_id?: number;

    @Field()
    @IsString()
    @IsNotEmpty()
    nombre_completo: string;

    @Field()
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @Field({ nullable: true })
    @IsOptional()
    @IsString()
    telefono?: string;

    @Field({ nullable: true })
    @IsOptional()
    @IsString()
    instagram_handle?: string;

    @Field({ nullable: true })
    @IsOptional()
    @IsString()
    calle_y_numero?: string;

    @Field({ nullable: true })
    @IsOptional()
    @IsString()
    colonia?: string;

    @Field({ nullable: true })
    @IsOptional()
    @IsString()
    codigo_postal?: string;

    @Field(() => Int, { nullable: true })
    @IsOptional()
    @IsInt()
    municipio_id?: number;

    @Field({ nullable: true })
    @IsOptional()
    @IsString()
    facultad_o_campus?: string;

    @Field({ nullable: true })
    @IsOptional()
    @IsString()
    punto_entrega_habitual?: string;

    @Field({ nullable: true })
    @IsOptional()
    @IsString()
    estado_laboral?: string;
}
