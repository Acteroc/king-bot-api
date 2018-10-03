import axios, { AxiosInstance } from 'axios';
import { clash_obj } from './util';
import manage_login from './login';
import settings from './settings';
import state from './state';
import database from './database';

class api {
	private ax: AxiosInstance;

	session: string = '';
	token: string = '';
	msid: string = '';

	constructor() {
		this.ax = axios.create();
		this.ax.defaults.withCredentials = true;

		//set base url to localhost if in dev mode
		if(settings.dev_mode) this.ax.defaults.baseURL = 'http://localhost:3030/api';
	}

	async login(email: string, password: string, gameworld: string) {
		await manage_login(this.ax, email, password, gameworld);

		// assign login credentials
		const { session_gameworld, token_gameworld, msid } = database.get('account').value();
		this.session = session_gameworld;
		this.token = token_gameworld;
		this.msid = msid;

		// set base url
		this.ax.defaults.baseURL = `https://${gameworld.toLowerCase()}.kingdoms.com/api`;
	}

	async get_all(): Promise<object> {
		const session: string = this.session;

		const payload = {
			controller: 'player',
			action: 'getAll',
			params: {},
			session
		};

		const response = await this.ax.post(`/?c=player&a=getAll&t${Date.now()}`, payload);

		this.merge_data(response.data);

		return response.data;
	}

	async get_cache(params: string[]): Promise<object> {
		const session: string = this.session;
		
		const payload = {
			controller: 'cache',
			action: 'get',
			params: {
				names: params
			},
			session
		};

		const response = await this.ax.post(`/?c=cache&a=get&t${Date.now()}`, payload);

		this.merge_data(response.data);

		return response.data;
	}

	async send_farmlists(lists: number[], village_id: number): Promise<object> {
		const params = {
			listIds: lists,
			villageId: village_id
		};

		return await this.post('startFarmListRaid', 'troops', params);
	}

	async upgrade_building(buildingType: number, locationId: number, villageId: number): Promise<void> {
		const params = {
			buildingType,
			locationId,
			villageId
		};

		return await this.post('upgrade', 'building', params);
	}

	async post(action: string, controller: string, params: object, merge: boolean = true): Promise<any> {
		const session = this.session;

		const payload = {
			action,
			controller,
			params,
			session
		};

		const response = await this.ax.post(`/?t${Date.now()}`);
		
		if(merge) this.merge_data(response.data);

		return response.data;
	}

	// merges data into state object
	merge_data(data: any): void {
		state.set_state(clash_obj(data, 'cache', 'response'));
	}
}

export default new api();
