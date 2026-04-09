import { InputType, Field, Int, PartialType } from '@nestjs/graphql';
import { IsInt, IsBoolean, IsOptional } from 'class-validator';
import { CreateProductoInput } from './create-producto.input';

@InputType()
export class UpdateProductoInput extends PartialType(CreateProductoInput) {
    @Field(() => Int)
    @IsInt()
    id_producto: number;

    @Field({ nullable: true })
    @IsOptional()
    @IsBoolean()
    activo?: boolean;
}
