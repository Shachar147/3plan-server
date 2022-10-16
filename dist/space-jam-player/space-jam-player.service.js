"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SpaceJamPlayerService = void 0;
const common_1 = require("@nestjs/common");
let SpaceJamPlayerService = class SpaceJamPlayerService {
    constructor() {
        this.logger = new common_1.Logger('SpaceJamPlayer');
    }
    async searchPlayer(name) {
        const results = await this.listPlayers({
            search: name,
        });
        if (results.length === 0) {
            throw new common_1.NotFoundException('Space Jam Player with name ' + name + ' not found');
        }
        return results.length > 0 ? results[0] : undefined;
    }
    async listPlayers(filterDto) {
        const IMAGE_FOLDER = '/space-jam/';
        const monstars = [
            {
                team: 'Monstars',
                nickname: 'Pound',
                name: 'Charles Barkley',
                picture: IMAGE_FOLDER + 'pound.png',
                description: "Pound, who stole Charles Barkley's talent is the overweight orange leader of the Monstars. He is bossy, demanding, mean-spirited, and takes pleasure in bullying Michael Jordan and the Looney Tunes characters. He speaks in a very deep voice.",
            },
            {
                team: 'Monstars',
                nickname: 'Bang',
                name: 'Patrick Ewing',
                picture: IMAGE_FOLDER + 'bang.png',
                description: "Bang, who stole Patrick Ewing's talent is the green second-in-command of the Monstars. He is very tough and aggressive. He has a large chin, small dragon-like ears, spikes on his back and a red orange flat top. He enjoys insulting Michael Jordan and picking on the Looney Tunes. He has the ability to breathe fire. He speaks in a deep growling voice.",
            },
            {
                team: 'Monstars',
                nickname: 'Bupkus',
                name: 'Larry Johnson',
                picture: IMAGE_FOLDER + 'bupkus.png',
                description: "Bupkus, who stole Larry Johnson's talent is the buff purple monstar. He has dark purple hair, and he is very emotional and cocky. He enjoys mocking Michael Jordan and hurting the Looney Tunes. He speaks in a deep suave voice.",
            },
            {
                team: 'Monstars',
                nickname: 'Blanko',
                name: 'Shawn Bradley',
                picture: IMAGE_FOLDER + 'blanko.png',
                description: "Blanko, who stole Shawn Bradley's talent is the tall blue monstar. He has dark blue hair, pointy ears, and a buck tooth. He is dimwitted and more laid-back than his teammates. He is friendly to Michael Jordan and Tweety. He speaks in a thick Californian accent.",
            },
            {
                team: 'Monstars',
                nickname: 'Nawt',
                name: 'Muggsy Bogues',
                picture: IMAGE_FOLDER + 'nawt.png',
                description: "Nawt, who stole Muggsy Bogues's talent is the short red monstar. He is smart and hyperactive. He speaks in a high voice.",
            },
        ];
        const goonSquad = [
            {
                team: 'Goon Squad',
                nickname: 'The Brew',
                name: 'Anthony Davis',
                picture: IMAGE_FOLDER + 'the-brew.png',
                description: "The Brow, played by Anthony Davis, is a bird-like opponent. The Brow was seen flying in the trailer, which seems like an extremely unfair advantage in a basketball game, but I digress. The Brow obviously plays on Davis' notable unibrow.",
            },
            {
                team: 'Goon Squad',
                nickname: 'Wet Fire',
                name: 'Klay Thompson',
                picture: IMAGE_FOLDER + 'wet-fire.png',
                description: 'Klay Thompson plays Wet-Fire, an opponent that changes between being water-based and fire-based. In the trailer it almost seemed as if these were two different characters, but it\'s the same one. Being "wet" in basketball means you have a good jump shot, which Thompson is known for. And then being on fire is a sports term for when you\'re playing well, or on a hot streak.',
            },
            {
                team: 'Goon Squad',
                nickname: 'Chronos',
                name: 'Damian Lillard',
                picture: IMAGE_FOLDER + 'chronos.png',
                description: 'Damian Lillard plays Chronos, who appears to be a robot-like villain. As Wikipedia notes, Chronos is "the personification of time in pre-Socratic philosophy and later literature." This relates to Lillard, who\'s known for "Dame Time," or when he makes a clutch shot at the end of games. Often times, Lillard will even point to his wrist, where a watch would be, to signifiy when it\'s Dame Time.',
            },
            {
                team: 'Goon Squad',
                nickname: 'White Mamba',
                name: 'Diana Taurasi',
                picture: IMAGE_FOLDER + 'white-mamba.png',
                description: "Diana Taurasi plays the White Mamba, a play on Kobe Bryant's famous Black Mamba nickname. In fact, Bryant was the one who gave her that nickname as the two became good friends throughout their careers, per ESPN. The White Mamba is a snake-like villain.",
            },
            {
                team: 'Goon Squad',
                nickname: 'Arachnneka',
                name: 'Nneka Ogwumike',
                picture: IMAGE_FOLDER + 'arachnneka.png',
                description: "Nneka Ogwumike plays Arachnneka, a black and red spider-like basketball player with six arms and two legs. The name is a play on arachnid (a class of joint-legged invertebrate animals such as spiders) and Ogwumike's own first name, Nneka. There are rumors that Ogwumike's sister and fellow WNBA star Chiney Ogwumike also appears in the film, but she's not part of the Goon Squad.",
            },
        ];
        const tuneSquad = [
            {
                team: 'Tune Squad',
                nickname: 'Taz',
                name: 'Taz',
                picture: IMAGE_FOLDER + 'taz.png',
                description: 'Taz is an animated cartoon character featured in various Warner Bros. cartoons and comics. Taz is portrayed as a ferocious albeit dim-witted omnivore with a notoriously short temper. He is known for his tornado spinning ability and his really sharp teeth.',
            },
            {
                team: 'Tune Squad',
                nickname: 'Bugs Bunny',
                name: 'Bugs Bunny',
                picture: IMAGE_FOLDER + 'bugs-bunny.png',
                description: 'One of the Greatest cartoon characters of all time, Bugs Bunny is known to the world as \'the funniest character on Earth\'; better known for saying his famous quote "What\'s Up Doc?" Bugs has been seen in numerous films and comics over the last 5 decades.',
            },
            {
                team: 'Tune Squad',
                nickname: 'Daffy Duck',
                name: 'Daffy Duck',
                picture: IMAGE_FOLDER + 'daffy-duck.png',
                description: 'He is an animated cartoon character produced by Warner Bros. Voiced by Mel Blanc, Daffy Duck is a cunning, scheming and sly cartoon character. Daffy Duck also has been depicted as the best friend and occasional arch-rival of Bugs Bunny. Daffy\'s Female counter-part goes by the name of "Mellisa Duck".',
            },
            {
                team: 'Tune Squad',
                nickname: 'Lola Bunny',
                name: 'Lola Bunny',
                picture: IMAGE_FOLDER + 'lola-bunny.png',
                description: 'Bugs Bunny\'s girlfriend. She was first seen in the movie "Space Jam".\n',
            },
            {
                team: 'Tune Squad',
                nickname: 'Sylvester Pussycat',
                name: 'Sylvester Pussycat',
                picture: IMAGE_FOLDER + 'sylvester.png',
                description: '',
            },
        ];
        const nbaStars = [
            {
                team: 'Goon Squad',
                nickname: 'King James',
                name: 'LeBron James',
                picture: IMAGE_FOLDER + 'lebron-james.png',
                description: '',
            },
            {
                team: 'Tune Squad',
                nickname: 'The Goat',
                name: 'Michael Jordan',
                picture: IMAGE_FOLDER + 'Jordan.png',
                description: '',
            },
        ];
        let arr = [...monstars, ...goonSquad, ...tuneSquad, ...nbaStars];
        const { search, name, team } = filterDto;
        if (search)
            arr = arr.filter((iter) => iter.name.toLowerCase().indexOf(search.toLowerCase()) !== -1 ||
                iter.team.toLowerCase().indexOf(search.toLowerCase()) !== -1 ||
                iter.nickname.toLowerCase().indexOf(search.toLowerCase()) !== -1);
        if (name)
            arr = arr.filter((iter) => iter.name.toLowerCase() === name.toLowerCase());
        if (team)
            arr = arr.filter((iter) => iter.team.toLowerCase() === team.toLowerCase());
        arr = arr.map((iter) => {
            iter['real_name'] = iter.name;
            iter.name = iter.nickname;
            return iter;
        });
        return arr;
    }
};
SpaceJamPlayerService = __decorate([
    common_1.Injectable(),
    __metadata("design:paramtypes", [])
], SpaceJamPlayerService);
exports.SpaceJamPlayerService = SpaceJamPlayerService;
//# sourceMappingURL=space-jam-player.service.js.map