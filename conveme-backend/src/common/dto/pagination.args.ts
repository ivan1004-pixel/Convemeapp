import { ArgsType, Field, Int } from '@nestjs/graphql';
import { Min, Max } from 'class-validator';

@ArgsType()
export class PaginationArgs {
  @Field(() => Int, { nullable: true })
  @Min(0)
  skip?: number = 0;

  @Field(() => Int, { nullable: true })
  @Min(1)
  @Max(50)
  take?: number = 20;
}
