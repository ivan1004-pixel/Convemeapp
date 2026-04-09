import { InputType, Field, Int, PartialType } from '@nestjs/graphql';
import { CreateEventoInput } from './create-evento.input';
import { IsInt, IsNotEmpty } from 'class-validator';

@InputType()
export class UpdateEventoInput extends PartialType(CreateEventoInput) {
    @Field(() => Int)
    @IsInt()
    @IsNotEmpty()
    id_evento: number;
}
