import { InputType, Field, Int, PartialType } from '@nestjs/graphql';
import { CreateCorteVendedorInput } from './create-corte-vendedor.input';
import { IsInt, IsNotEmpty } from 'class-validator';

@InputType()
export class UpdateCorteVendedorInput extends PartialType(CreateCorteVendedorInput) {
    @Field(() => Int)
    @IsInt()
    @IsNotEmpty()
    id_corte: number;
}
