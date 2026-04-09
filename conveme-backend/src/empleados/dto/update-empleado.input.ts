import { InputType, Field, Int, PartialType } from '@nestjs/graphql';
import { CreateEmpleadoInput } from './create-empleado.input';
import { IsInt, IsNotEmpty } from 'class-validator'; // 🟢 IMPORTANTE

@InputType()
export class UpdateEmpleadoInput extends PartialType(CreateEmpleadoInput) {
    @Field(() => Int)
    @IsInt()
    @IsNotEmpty()
    id_empleado: number;
}
