import { InputType, Field, Int, Float, PartialType } from '@nestjs/graphql';
import { CreateInsumoInput } from './create-insumo.input';
import { IsInt, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';

@InputType()
export class UpdateInsumoInput extends PartialType(CreateInsumoInput) {
    @Field(() => Int)
    @IsInt()
    @IsNotEmpty()
    id_insumo: number;

    @Field(() => Float, { nullable: true })
    @IsOptional()
    @IsNumber()
    stock_actual?: number;
}
