import { InputType, Field, Int, PartialType } from '@nestjs/graphql';
import { CreateOrdenProduccionInput } from './create-orden-produccion.input';
import { IsInt, IsNotEmpty } from 'class-validator';

@InputType()
export class UpdateOrdenProduccionInput extends PartialType(CreateOrdenProduccionInput) {
    @Field(() => Int)
    @IsInt()
    @IsNotEmpty()
    id_orden_produccion: number;
}
