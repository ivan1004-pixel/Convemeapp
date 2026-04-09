import { InputType, Field, Int, Float, PartialType } from '@nestjs/graphql';
import { CreateVendedorInput } from './create-vendedor.input';
import { IsInt, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';

@InputType()
export class UpdateVendedorInput extends PartialType(CreateVendedorInput) {
    @Field(() => Int)
    @IsInt()
    @IsNotEmpty()
    id_vendedor: number;

    @Field(() => Float, { nullable: true })
    @IsOptional()
    @IsNumber()
    comision_fija_menudeo?: number;

    @Field(() => Float, { nullable: true })
    @IsOptional()
    @IsNumber()
    comision_fija_mayoreo?: number;

    @Field(() => Float, { nullable: true })
    @IsOptional()
    @IsNumber()
    meta_ventas_mensual?: number;
}
