import { InputType, Field, Int, Float } from '@nestjs/graphql';
import { IsString, IsInt, IsNumber, IsOptional } from 'class-validator';

@InputType()
export class CreateProductoInput {
    @Field()
    @IsString()
    sku: string;

    @Field()
    @IsString()
    nombre: string;

    @Field(() => Int)
    @IsInt()
    categoria_id: number;

    @Field(() => Int)
    @IsInt()
    tamano_id: number;

    @Field(() => Float)
    @IsNumber()
    precio_unitario: number;

    @Field(() => Float, { nullable: true })
    @IsOptional()
    @IsNumber()
    precio_mayoreo?: number;

    @Field(() => Int, { nullable: true })
    @IsOptional()
    @IsInt()
    cantidad_minima_mayoreo?: number;

    @Field(() => Float, { nullable: true })
    @IsOptional()
    @IsNumber()
    costo_produccion?: number;
}
