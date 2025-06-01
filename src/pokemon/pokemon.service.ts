import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException, Query } from '@nestjs/common';
import { CreatePokemonDto } from './dto/create-pokemon.dto';
import { UpdatePokemonDto } from './dto/update-pokemon.dto';
import { isValidObjectId, Model } from 'mongoose';
import { Pokemon } from './entities/pokemon.entity';
import { InjectModel } from '@nestjs/mongoose';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PokemonService {

  private defaultLimit: number;
  constructor(
    @InjectModel(Pokemon.name)
    private readonly pokemonModel: Model<Pokemon>,
    private readonly configService: ConfigService
  ) {
    this.defaultLimit = configService.getOrThrow<number>('default_limit');
   }

  async create(createPokemonDto: CreatePokemonDto) {
    createPokemonDto.name = createPokemonDto.name.toLowerCase();

    try {
      const pokemon = await this.pokemonModel.create(createPokemonDto);
      return pokemon;
    } catch (error) {
      this.handleExeptions(error);
    }
  }

  async createMany(pokemons: CreatePokemonDto[]) {
    const lowerCasePokemons = pokemons.map(p => ({
      name: p.name.toLowerCase(),
      no: p.no,
    }));

    try {
      const result = await this.pokemonModel.insertMany(lowerCasePokemons, { ordered: false });
      return result;
    } catch (error) {
      this.handleExeptions(error);
    }
  }

  findAll(paginationDto: PaginationDto) {
    const { limit = +process.env.DEFAULT_LIMI!, offset = 0 } = paginationDto;
    return this.pokemonModel.find()
      .limit(limit)
      .skip(offset)
      .sort({
        no: 1
      })
      .select('-__v');
  }


  async findOne(value: string) {
    let pokemon: Pokemon | null = null;

    if (!isNaN(+value)) {
      pokemon = await this.pokemonModel.findOne({ no: value });
    }

    if (!pokemon && isValidObjectId(value)) {
      pokemon = await this.pokemonModel.findById(value);
    }

    if (!pokemon) {
      pokemon = await this.pokemonModel.findOne({ name: value.toLowerCase().trim() })
    }

    if (!pokemon) {
      throw new NotFoundException(`Pokemon with id, name or no "${value}" found`);
    }
    return pokemon;
  }

  async update(value: string, updatePokemonDto: UpdatePokemonDto) {

    const pokemon = await this.findOne(value);
    console.log(pokemon)
    if (updatePokemonDto && updatePokemonDto.name)
      updatePokemonDto.name = updatePokemonDto.name.toLowerCase().trim();


    try {
      await pokemon.updateOne(updatePokemonDto);
      return { ...pokemon.toJSON(), ...updatePokemonDto }
    } catch (error) {
      this.handleExeptions(error);
    }
  }

  async remove(id: string) {


    // const result = await this.pokemonModel.findOneAndDelete(id);

    const { deletedCount } = await this.pokemonModel.deleteMany({ _id: id });

    if (deletedCount === 0) {
      throw new BadRequestException(`Pokemon with id "${id}" not found`);
    }
    return;
  }

  async removeAll() {
    const { deletedCount } = await this.pokemonModel.deleteMany({});

    return {
      message: `Deleted ${deletedCount} pokemons successfully.`,
    };
  }

  private handleExeptions(error: any) {
    if (error.code === 11000) {
      const fields = Object.entries(error.keyValue)
        .map(([key, value]) => `${key}: ${value}`)
        .join(', ');
      throw new BadRequestException(`Pokemon exist with ${fields}`);
    }
    console.log(error);
    throw new InternalServerErrorException(`Can't create or update pokemon - Check server logs`);
  }
}
