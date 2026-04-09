import { InputType, Field, Int, Float } from '@nestjs/graphql';
import {
    IsString,
    IsOptional,
    IsInt,
    IsNumber,
    IsBoolean,
    IsNotEmpty,
} from 'class-validator';

@InputType()
export class CreateEventoInput {
    @Field()
    @IsString()
    @IsNotEmpty()
    nombre: string;

    @Field({ nullable: true })
    @IsOptional()
    @IsString()
    descripcion?: string;

    // Se envía como string "YYYY-MM-DD" desde el front
    @Field({ nullable: true })
    @IsOptional()
    @IsString()
    fecha_inicio?: string;

    @Field({ nullable: true })
    @IsOptional()
    @IsString()
    fecha_fin?: string;

    @Field(() => Int, { nullable: true })
    @IsOptional()
    @IsInt()
    escuela_id?: number;

    @Field(() => Int, { nullable: true })
    @IsOptional()
    @IsInt()
    municipio_id?: number;

    @Field(() => Float, { nullable: true })
    @IsOptional()
    @IsNumber()
    costo_stand?: number;

    @Field({ nullable: true })
    @IsOptional()
    @IsBoolean()
    activo?: boolean;
}
