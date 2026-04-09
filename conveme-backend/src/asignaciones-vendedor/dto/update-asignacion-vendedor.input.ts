import { InputType, Field, Int, PartialType } from '@nestjs/graphql';
import { CreateAsignacionVendedorInput } from './create-asignacion-vendedor.input';
import { IsInt, IsNotEmpty } from 'class-validator';

@InputType()
export class UpdateAsignacionVendedorInput extends PartialType(CreateAsignacionVendedorInput) {
    @Field(() => Int)
    @IsInt()
    @IsNotEmpty()
    id_asignacion: number;
}
