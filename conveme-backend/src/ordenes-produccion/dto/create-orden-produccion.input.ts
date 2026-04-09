import { InputType, Field, Int, Float } from '@nestjs/graphql';
import { IsInt, IsNumber, IsOptional, IsString, IsNotEmpty, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

@InputType()
export class CreateDetOrdenInput {
    @Field(() => Int, { nullable: true })
    @IsOptional()
    @IsInt()
    id_det_orden?: number;

    @Field(() => Int, { nullable: true })
    @IsOptional()
    @IsInt()
    orden_produccion_id?: number;

    @Field(() => Int)
    @IsInt()
    @IsNotEmpty()
    insumo_id: number;

    @Field(() => Float)
    @IsNumber()
    @IsNotEmpty()
    cantidad_consumida: number;
}

@InputType()
export class CreateOrdenProduccionInput {
    @Field(() => Int)
    @IsInt()
    @IsNotEmpty()
    producto_id: number;

    @Field(() => Int)
    @IsInt()
    @IsNotEmpty()
    empleado_id: number;

    @Field(() => Int)
    @IsNumber()
    @IsNotEmpty()
    cantidad_a_producir: number;

    @Field({ nullable: true })
    @IsOptional()
    @IsString()
    estado?: string;

    @Field(() => [CreateDetOrdenInput])
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateDetOrdenInput) // 🟢 Clave para que valide el arreglo
    detalles: CreateDetOrdenInput[];
}
