import { InputType, Field, Int } from '@nestjs/graphql';
import { IsInt, IsString, IsOptional, IsNotEmpty, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

@InputType()
export class CreateDetAsignacionInput {
    @Field(() => Int, { nullable: true })
    @IsOptional()
    @IsInt()
    id_det_asignacion?: number;

    @Field(() => Int, { nullable: true })
    @IsOptional()
    @IsInt()
    asignacion_id?: number;

    @Field(() => Int)
    @IsInt()
    @IsNotEmpty()
    producto_id: number;

    @Field(() => Int)
    @IsInt()
    @IsNotEmpty()
    cantidad_asignada: number;
}

@InputType()
export class CreateAsignacionVendedorInput {
    @Field(() => Int)
    @IsInt()
    @IsNotEmpty()
    vendedor_id: number;

    @Field({ nullable: true })
    @IsOptional()
    @IsString()
    estado?: string;

    @Field(() => [CreateDetAsignacionInput])
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateDetAsignacionInput) // 🟢 Super importante para validar listas
    detalles: CreateDetAsignacionInput[];
}
