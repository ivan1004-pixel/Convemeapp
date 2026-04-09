import { InputType, Field, Int, Float } from '@nestjs/graphql';
import { IsInt, IsOptional, IsNumber, IsString, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

@InputType()
export class CreateDetVentaInput {
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
export class CreateVentaInput {
    @Field(() => Int, { nullable: true })
    @IsOptional()
    @IsInt()
    cliente_id?: number;

    @Field(() => Int, { nullable: true })
    @IsOptional()
    @IsInt()
    vendedor_id?: number;

    @Field(() => Float)
    @IsNumber()
    monto_total: number;

    @Field({ nullable: true })
    @IsOptional()
    @IsString()
    metodo_pago?: string;

    @Field({ nullable: true })
    @IsOptional()
    @IsString()
    estado?: string;

    @Field(() => [CreateDetVentaInput])
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateDetVentaInput)
    detalles: CreateDetVentaInput[];
}
