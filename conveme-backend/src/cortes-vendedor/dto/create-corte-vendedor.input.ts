import { InputType, Field, Int, Float } from '@nestjs/graphql';
import {
    IsInt,
    IsOptional,
    IsNumber,
    IsString,
    IsNotEmpty,
    IsArray,
    ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

@InputType()
export class CreateDetCorteInput {
    // Opcional para ediciones / upsert
    @Field(() => Int, { nullable: true })
    @IsOptional()
    @IsInt()
    id_det_corte?: number;

    // Opcional, lo rellena TypeORM por relación cuando creas
    @Field(() => Int, { nullable: true })
    @IsOptional()
    @IsInt()
    corte_id?: number;

    @Field(() => Int)
    @IsInt()
    @IsNotEmpty()
    producto_id: number;

    @Field(() => Int, { defaultValue: 0 })
    @IsInt()
    cantidad_vendida: number;

    @Field(() => Int, { defaultValue: 0 })
    @IsInt()
    cantidad_devuelta: number;

    @Field(() => Int, { defaultValue: 0 })
    @IsInt()
    merma_reportada: number;
}

@InputType()
export class CreateCorteVendedorInput {
    @Field(() => Int)
    @IsInt()
    @IsNotEmpty()
    vendedor_id: number;

    @Field(() => Int)
    @IsInt()
    @IsNotEmpty()
    asignacion_id: number;

    @Field(() => Float)
    @IsNumber()
    @IsNotEmpty()
    dinero_esperado: number;

    @Field(() => Float)
    @IsNumber()
    @IsNotEmpty()
    dinero_total_entregado: number;

    @Field(() => Float)
    @IsNumber()
    @IsNotEmpty()
    diferencia_corte: number;

    @Field({ nullable: true })
    @IsOptional()
    @IsString()
    observaciones?: string;

    @Field(() => [CreateDetCorteInput])
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateDetCorteInput)
    detalles: CreateDetCorteInput[];
}
