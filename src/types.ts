/**
 * Busan Festival data type as returned by the Busan Festival Open API
 */
export interface FestivalItem {
  UC_SEQ: number;
  MAIN_TITLE: string;
  GUGUN_NM: string;
  LAT: number;
  LNG: number;
  PLACE: string;
  TITLE: string;
  SUBTITLE: string;
  MAIN_PLACE: string;
  ADDR1: string;
  ADDR2: string;
  CNTCT_TEL: string;
  HOMEPAGE_URL: string;
  TRFC_INFO: string;
  USAGE_DAY: string;
  USAGE_DAY_WEEK_AND_TIME: string;
  USAGE_AMOUNT: string;
  MAIN_IMG_NORMAL: string;
  MAIN_IMG_THUMB: string;
  ITEMCNTNTS: string;
  MIDDLE_SIZE_RM1: string;
}

export interface FestivalResponseHeader {
  code: string;
  message: string;
}

export interface FestivalResponse {
  getFestivalKr: {
    header: FestivalResponseHeader;
    item: FestivalItem[];
    numOfRows: number;
    pageNo: number;
    totalCount: number;
  };
}
