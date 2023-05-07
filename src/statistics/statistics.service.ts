import { Injectable } from '@nestjs/common';
import {getConnection} from "typeorm";

@Injectable()
export class StatisticsService {
    async getTripsStatistics(): Promise<any[]> {
        const query = `
      SELECT t.name, jsonb_array_length(t."categories") AS num_of_categories, jsonb_array_length(t."calendarEvents") AS scheduled_events, a.sidebar_events, t."userId", u."username", t."lastUpdateAt", u."lastLoginAt", u."numOfLogins"
      FROM trip as t
      LEFT JOIN LATERAL (
        SELECT COUNT(*) as sidebar_events
        FROM jsonb_each(t."sidebarEvents") AS json_element
        CROSS JOIN LATERAL jsonb_array_elements_text(json_element.value::jsonb) AS unnested_elements
      ) as a ON true
      LEFT JOIN public.user u ON u.id = t."userId"
      ORDER BY t."lastUpdateAt" DESC
    `;

        const connection = getConnection();
        return await connection.query(query);
    }
}
