import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { PokeResponse } from './interfaces/poke-response.interface';
import { PokemonService } from 'src/pokemon/pokemon.service';

@Injectable()
export class SeedService {
  constructor(
    private readonly httpService: HttpService,
    private readonly pokemonServie: PokemonService
  ) { }
  async executeSeed() {
    console.log(fetch)

    await this.pokemonServie.removeAll();
    const {data} = await firstValueFrom(
      this.httpService.get<PokeResponse>('https://pokeapi.co/api/v2/pokemon?limit=151'),
    );

    // const insertPromiseArray: Promise<any>[] = [];

    // data.results.forEach(({name, url}) => {
    //   const  segments = url.split('/');
    //   const no:number = +segments[segments.length -2];
    //   // await this.pokemonServie.create({no, name});

    //   insertPromiseArray.push(
    //     this.pokemonServie.create({no, name})
    //   ); 
    //   console.log({name, no});
    // })

    // await Promise.all(insertPromiseArray);

    const pokemonToInsert: {name: string, no: number}[] = [];

    data.results.forEach(({name, url}) => {
      const  segments = url.split('/');
      const no:number = +segments[segments.length -2];
      // await this.pokemonServie.create({no, name});

      pokemonToInsert.push({name, no})
      console.log({name, no});
    })

    await this.pokemonServie.createMany(pokemonToInsert);
    return 'Seed Executed';
  }
}
