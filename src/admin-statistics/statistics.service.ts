import { Injectable } from '@nestjs/common';
import {getConnection} from "typeorm";
import {TEMPLATES_USER_NAME} from "../shared/const";

@Injectable()
export class StatisticsService {
    async getTripsStatistics(): Promise<any[]> {
        const query = `
      SELECT t.name, t."isHidden", jsonb_array_length(t."categories") AS num_of_categories, jsonb_array_length(t."calendarEvents") AS scheduled_events, a.sidebar_events, u."id" as "userId", u."username", t."lastUpdateAt", u."lastLoginAt", u."numOfLogins"
      FROM trip as t
      LEFT JOIN LATERAL (
        SELECT COUNT(*) as sidebar_events
        FROM jsonb_each(t."sidebarEvents") AS json_element
        CROSS JOIN LATERAL jsonb_array_elements_text(json_element.value::jsonb) AS unnested_elements
      ) as a ON true
      RIGHT JOIN public.user u ON u.id = t."userId
      WHERE u.username != ${TEMPLATES_USER_NAME}"
      ORDER BY t."lastUpdateAt" DESC
    `;

        const connection = getConnection();
        return await connection.query(query);
    }

    async getTotalPointOfInterests(): Promise<number> {
        const query = `SELECT COUNT(*) as totalpois FROM point_of_interest`;
        const connection = getConnection();
        const totalPoisResult = await connection.query(query);
        return totalPoisResult[0]["totalpois"];
    }

    async getTotalSavedItems(): Promise<number> {
        const query = `SELECT COUNT(*) as totalsaved FROM saved_collections_item`;
        const connection = getConnection();
        const totalPoisResult = await connection.query(query);
        return totalPoisResult[0]["totalsaved"];
    }

    async getTotalDestinations(): Promise<number> {
        const query = `SELECT COUNT(distinct destination) as total FROM point_of_interest`;
        const connection = getConnection();
        const totalPoisResult = await connection.query(query);
        return totalPoisResult[0]["total"];
    }

    async getTotalSavedCollections() {
        const query = `SELECT COUNT(*) as total FROM saved_collections`;
        const connection = getConnection();
        const totalPoisResult = await connection.query(query);
        return totalPoisResult[0]["total"];
    }
}
