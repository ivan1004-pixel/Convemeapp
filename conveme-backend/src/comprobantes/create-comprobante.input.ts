import { InputType, Field, Int, Float } from '@nestjs/graphql';
import { IsInt, IsNumber, IsOptional, IsString, IsNotEmpty } from 'class-validator';

@InputType()
export class CreateComprobanteInput {
    @Field(() => Int)
    @IsInt()
    @IsNotEmpty()
    vendedor_id: number;

    @Field(() => Int)
    @IsInt()
    @IsNotEmpty()
    admin_id: number;

    @Field(() => Float)
    @IsNumber()
    @IsNotEmpty()
    total_vendido: number;

    @Field(() => Float)
    @IsNumber()
    @IsNotEmpty()
    comision_vendedor: number;

    @Field(() => Float)
    @IsNumber()
    @IsNotEmpty()
    monto_entregado: number;

    @Field(() => Float, { nullable: true, defaultValue: 0 })
    @IsOptional()
    @IsNumber()
    saldo_pendiente?: number;

    @Field({ nullable: true })
    @IsOptional()
    @IsString()
    notas?: string;
}
