import { InputType, Field, Int, PartialType } from '@nestjs/graphql';
import { CreatePromocionInput } from './create-promocion.input';
import { IsInt, IsNotEmpty } from 'class-validator';

@InputType()
export class UpdatePromocionInput extends PartialType(CreatePromocionInput) {
    @Field(() => Int)
    @IsInt()
    @IsNotEmpty()
    id_promocion: number;
}
