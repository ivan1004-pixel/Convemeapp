import { InputType, Field, Int, PartialType } from '@nestjs/graphql';
import { IsInt } from 'class-validator';
import { CreateVentaInput } from './create-venta.input';

@InputType()
export class UpdateVentaInput extends PartialType(CreateVentaInput) {
    @Field(() => Int)
    @IsInt()
    id_venta: number;
}
