import { InputType, Field, Int, Float } from '@nestjs/graphql';
import {
    IsInt,
    IsNumber,
    IsOptional,
    IsString,
    IsArray,
    ValidateNested,
    IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';

@InputType()
export class CreateDetPedidoInput {
    @Field(() => Int)
    @IsInt()
    producto_id: number;

    @Field(() => Int)
    @IsInt()
    cantidad: number;

    @Field(() => Float)
    @IsNumber()
    precio_unitario: number;
}

@InputType()
export class CreatePedidoInput {
    @Field(() => Int, { nullable: true })
    @IsOptional()
    @IsInt()
    cliente_id?: number;

    @Field(() => Int, { nullable: true })
    @IsOptional()
    @IsInt()
    vendedor_id?: number;

    @Field({ nullable: true })
    @IsOptional()
    @IsDateString()
    fecha_entrega_estimada?: string;

    @Field(() => Float)
    @IsNumber()
    monto_total: number;

    @Field(() => Float, { nullable: true, defaultValue: 0 })
    @IsOptional()
    @IsNumber()
    anticipo?: number;

    @Field({ nullable: true })
    @IsOptional()
    @IsString()
    estado?: string;

    @Field(() => [CreateDetPedidoInput], { nullable: true })
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateDetPedidoInput)
    detalles?: CreateDetPedidoInput[];
}
