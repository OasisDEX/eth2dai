import * as moment from 'moment';
import { GroupMode, groupModeMapper, PriceChartDataPoint } from './pricechart';

export const fakeDailyData = [
  {
    timestamp: new Date('2016-01-01'),
    open: 1082.4,
    high: 1090.25,
    low: 1076.15,
    close: 1088.75,
    turnover: 86.78,
  },
  {
    timestamp: new Date('2016-01-04'),
    open: 1084,
    high: 1084,
    low: 1068.1,
    close: 1070.5,
    turnover: 139.19,
  },
  {
    timestamp: new Date('2016-01-05'),
    open: 1070.2,
    high: 1074.8,
    low: 1061.35,
    close: 1062.4,
    turnover: 84.25,
  },
  {
    timestamp: new Date('2016-01-06'),
    open: 1056.65,
    high: 1076.75,
    low: 1056.65,
    close: 1067.1,
    turnover: 111.31,
  },
  {
    timestamp: new Date('2016-01-07'),
    open: 1060.1,
    high: 1064.9,
    low: 1049.7,
    close: 1056.2,
    turnover: 160.17,
  },
  {
    timestamp: new Date('2016-01-08'),
    open: 1061.95,
    high: 1064.5,
    low: 1057.25,
    close: 1062.35,
    turnover: 92.5,
  },
  {
    timestamp: new Date('2016-01-15'),
    open: 1061.25,
    high: 1072.15,
    low: 1061.07,
    close: 1062.35,
    turnover: 84,
  },
  {
    timestamp: new Date('2016-01-25'),
    open: 1070.2,
    high: 1074.8,
    low: 1061.35,
    close: 1062.4,
    turnover: 25,
  },
  {
    timestamp: new Date('2016-01-26'),
    open: 1068.2,
    high: 1073.8,
    low: 1061.35,
    close: 1069.4,
    turnover: 10.25,
  },
];

export function generate(
  groupMode: GroupMode,
  startDate: Date,
  endDate: Date,
  minPrice: number,
  maxPrice: number,
  minTurnover: number,
  maxTurnover: number,
): PriceChartDataPoint[] {
  const result = [];
  const addUnit = groupModeMapper[groupMode].addUnit as moment.unitOfTime.DurationConstructor;

  let prevMid = Math.random() * (maxPrice - minPrice) + minPrice;
  const maxMidDiff = (maxPrice - minPrice) * 0.12;
  const maxOpenCloseDiff = (maxPrice - minPrice) * 0.2;
  const maxLowHighDiff = (maxPrice - minPrice) * 0.25;

  const currDate = moment(startDate);
  const lastDate = moment(endDate);

  while (currDate.add(1, addUnit).diff(lastDate) < 0) {
    const timestamp = currDate.clone().toDate();
    const turnover = Math.random() * (maxTurnover - minTurnover) + minTurnover;

    let mid = Math.random() * (maxPrice - minPrice) + minPrice;
    if (Math.abs(mid - prevMid) > maxMidDiff) {
      mid = mid > prevMid ? prevMid + maxMidDiff : prevMid - maxMidDiff;
    }

    const openCloseDiff = (Math.random() - 0.5) * maxOpenCloseDiff;
    const open = mid + openCloseDiff;
    const close = mid - openCloseDiff;

    const lowDiff = Math.random() * maxLowHighDiff;
    const low = Math.max(Math.min(mid - lowDiff, open, close), 0);

    const highDiff = Math.random() * maxLowHighDiff;
    const high = Math.min(Math.max(mid + highDiff, open, close), maxPrice);

    result.push({ timestamp, open, high, low, close, turnover } as PriceChartDataPoint);

    prevMid = mid;
  }
  console.warn('result is ', JSON.stringify(result));
  return result;
}

export const bigFakeDailyData = [{
  timestamp: new Date('2018-01-05T23:00:00.000Z'),
  open: 304.10725222639076,
  high: 316.2231265452051,
  low: 270.16755633505545,
  close: 282.9979728716638,
  turnover: 184.90410557846909
}, {
  timestamp: new Date('2018-01-06T23:00:00.000Z'),
  open: 292.54407259949926,
  high: 305.0370672997416,
  low: 290.9364555077939,
  close: 303.6593419441938,
  turnover: 83.335849579272
}, {
  timestamp: new Date('2018-01-07T23:00:00.000Z'),
  open: 293.20068897151447,
  high: 314.02486591929545,
  low: 293.20068897151447,
  close: 314.02486591929545,
  turnover: 133.04277310832364
}, {
  timestamp: new Date('2018-01-08T23:00:00.000Z'),
  open: 304.06816403350604,
  high: 307.12892940657,
  low: 289.9351378318279,
  close: 289.9351378318279,
  turnover: 123.40757701676337
}, {
  timestamp: new Date('2018-01-09T23:00:00.000Z'),
  open: 293.380251203662,
  high: 298.5327411958602,
  low: 269.33918815746085,
  close: 274.22305066167195,
  turnover: 30.23137794208364
}, {
  timestamp: new Date('2018-01-10T23:00:00.000Z'),
  open: 298.84367486801636,
  high: 309.253894106841,
  low: 279.97962556453234,
  close: 295.15962699731756,
  turnover: 188.0518761088782
}, {
  timestamp: new Date('2018-01-11T23:00:00.000Z'),
  open: 297.83432690695867,
  high: 311.9185958381612,
  low: 296.07154780987423,
  close: 309.6975482297484,
  turnover: 3.846912512822917
}, {
  timestamp: new Date('2018-01-12T23:00:00.000Z'),
  open: 295.5638956757434,
  high: 316.017995799521,
  low: 295.5638956757434,
  close: 312.4597896105057,
  turnover: 42.87588833136323
}, {
  timestamp: new Date('2018-01-13T23:00:00.000Z'),
  open: 300.72317359183705,
  high: 300.72317359183705,
  low: 284.2542226505169,
  close: 284.2542226505169,
  turnover: 19.220921232461166
}, {
  timestamp: new Date('2018-01-14T23:00:00.000Z'),
  open: 308.6067856622557,
  high: 317.86883809673725,
  low: 292.1269634305437,
  close: 302.77061058009826,
  turnover: 178.0063733119397
}, {
  timestamp: new Date('2018-01-15T23:00:00.000Z'),
  open: 285.32635254104156,
  high: 319.5054377727363,
  low: 284.1970745691227,
  close: 299.6510437013124,
  turnover: 187.42967948236966
}, {
  timestamp: new Date('2018-01-16T23:00:00.000Z'),
  open: 316.4395671493052,
  high: 323.1542860334614,
  low: 288.3541343344961,
  close: 294.9378290930487,
  turnover: 148.6679588261691
}, {
  timestamp: new Date('2018-01-17T23:00:00.000Z'),
  open: 295.21875968458767,
  high: 308.09565054925196,
  low: 279.3515515156935,
  close: 289.7586365577663,
  turnover: 9.955346578347976
}, {
  timestamp: new Date('2018-01-18T23:00:00.000Z'),
  open: 283.0431234674414,
  high: 297.3338265666283,
  low: 264.22796665398414,
  close: 275.5342727749126,
  turnover: 128.05099967204245
}, {
  timestamp: new Date('2018-01-19T23:00:00.000Z'),
  open: 284.76276715219433,
  high: 319.9417160462475,
  low: 269.9205625999201,
  close: 300.21462909015963,
  turnover: 17.75253023982852
}, {
  timestamp: new Date('2018-01-20T23:00:00.000Z'),
  open: 298.0355094088713,
  high: 326.7520506709545,
  low: 289.1658771855153,
  close: 313.34188683348265,
  turnover: 167.30794411600363
}, {
  timestamp: new Date('2018-01-21T23:00:00.000Z'),
  open: 283.31497550318346,
  high: 314.46877040228753,
  low: 283.31497550318346,
  close: 301.6624207391705,
  turnover: 5.37521931799164
}, {
  timestamp: new Date('2018-01-22T23:00:00.000Z'),
  open: 298.07454764623213,
  high: 302.8208372379996,
  low: 287.86976278661604,
  close: 287.86976278661604,
  turnover: 134.4820308926517
}, {
  timestamp: new Date('2018-01-23T23:00:00.000Z'),
  open: 305.5702794122635,
  high: 323.007448623145,
  low: 289.0354184425925,
  close: 306.77403102058463,
  turnover: 198.8174264190814
}, {
  timestamp: new Date('2018-01-24T23:00:00.000Z'),
  open: 302.7789541959544,
  high: 307.1808467884132,
  low: 283.1653562368938,
  close: 283.1653562368938,
  turnover: 65.66309373295304
}, {
  timestamp: new Date('2018-01-25T23:00:00.000Z'),
  open: 308.7401643603441,
  high: 308.7401643603441,
  low: 294.02210873177035,
  close: 303.604146072504,
  turnover: 161.60348194381757
}, {
  timestamp: new Date('2018-01-26T23:00:00.000Z'),
  open: 312.9478927307559,
  high: 332.2318100688332,
  low: 302.3737305925713,
  close: 320.266120333006,
  turnover: 182.43809393760233
}, {
  timestamp: new Date('2018-01-27T23:00:00.000Z'),
  open: 336.5881004472549,
  high: 350,
  low: 314.0504524738818,
  close: 323.02591261650696,
  turnover: 150.7977835612519
}, {
  timestamp: new Date('2018-01-28T23:00:00.000Z'),
  open: 335.6808859315634,
  high: 345.7416421660464,
  low: 325.1481307073508,
  close: 333.0506687929455,
  turnover: 137.49712356823517
}, {
  timestamp: new Date('2018-01-29T23:00:00.000Z'),
  open: 310.88664098881816,
  high: 331.44491373569076,
  low: 297.9800898032937,
  close: 331.44491373569076,
  turnover: 169.54054056968144
}, {
  timestamp: new Date('2018-01-30T23:00:00.000Z'),
  open: 311.21673426311673,
  high: 320.44300179400994,
  low: 283.18986416092827,
  close: 304.7148204613922,
  turnover: 91.56398808215378
}, {
  timestamp: new Date('2018-01-31T23:00:00.000Z'),
  open: 312.16317713519436,
  high: 330.16837758931456,
  low: 307.4582232822797,
  close: 330.16837758931456,
  turnover: 106.56331881374614
}, {
  timestamp: new Date('2018-02-01T23:00:00.000Z'),
  open: 306.0134211434079,
  high: 309.918133581101,
  low: 290.4620392451189,
  close: 309.918133581101,
  turnover: 21.810325391424673
}, {
  timestamp: new Date('2018-02-02T23:00:00.000Z'),
  open: 285.6194330234774,
  high: 307.22220985927925,
  low: 280.3932832633572,
  close: 303.91212170103154,
  turnover: 162.6543478764173
}, {
  timestamp: new Date('2018-02-03T23:00:00.000Z'),
  open: 300.6620274615192,
  high: 321.0396144332249,
  low: 291.729480639537,
  close: 315.26952726298975,
  turnover: 17.98107068337404
}, {
  timestamp: new Date('2018-02-04T23:00:00.000Z'),
  open: 316.26661510588485,
  high: 331.3275921479241,
  low: 308.4351052869992,
  close: 326.06493961862407,
  turnover: 71.0091887222428
}, {
  timestamp: new Date('2018-02-05T23:00:00.000Z'),
  open: 298.67634237637265,
  high: 317.2552123481363,
  low: 298.67634237637265,
  close: 317.2552123481363,
  turnover: 97.97220189817203
}, {
  timestamp: new Date('2018-02-06T23:00:00.000Z'),
  open: 288.6725108983279,
  high: 310.9440004300919,
  low: 288.6725108983279,
  close: 300.85904382618105,
  turnover: 5.441402101238342
}, {
  timestamp: new Date('2018-02-07T23:00:00.000Z'),
  open: 307.9151823821037,
  high: 315.98584746208786,
  low: 299.6048874662347,
  close: 308.01637234240525,
  turnover: 110.94007915998345
}, {
  timestamp: new Date('2018-02-08T23:00:00.000Z'),
  open: 311.53919510023434,
  high: 343.01301183070336,
  low: 295.7335466837846,
  close: 330.7923596242746,
  turnover: 50.21762204577478
}, {
  timestamp: new Date('2018-02-09T23:00:00.000Z'),
  open: 324.2637969934199,
  high: 350,
  low: 316.17437242942685,
  close: 344.467757731089,
  turnover: 135.18092886039426
}, {
  timestamp: new Date('2018-02-10T23:00:00.000Z'),
  open: 326.81526467253235,
  high: 326.81526467253235,
  low: 315.51629005197657,
  close: 315.51629005197657,
  turnover: 101.48421099840267
}, {
  timestamp: new Date('2018-02-11T23:00:00.000Z'),
  open: 317.1197895607665,
  high: 321.8136772880391,
  low: 298.81176516374245,
  close: 298.81176516374245,
  turnover: 114.61698185194766
}, {
  timestamp: new Date('2018-02-12T23:00:00.000Z'),
  open: 289.53811706935636,
  high: 299.9934376551526,
  low: 289.53811706935636,
  close: 299.9934376551526,
  turnover: 62.24478690480792
}, {
  timestamp: new Date('2018-02-13T23:00:00.000Z'),
  open: 297.0831649333343,
  high: 319.41443465732317,
  low: 289.5145085948524,
  close: 318.84838979117467,
  turnover: 22.21570850343744
}, {
  timestamp: new Date('2018-02-14T23:00:00.000Z'),
  open: 302.911972669199,
  high: 310.8990190137391,
  low: 284.9064654802627,
  close: 286.61958205531,
  turnover: 44.191221125571545
}, {
  timestamp: new Date('2018-02-15T23:00:00.000Z'),
  open: 285.4845896642746,
  high: 301.5862969188177,
  low: 273.9794890477102,
  close: 277.6469650602344,
  turnover: 6.958816865802124
}, {
  timestamp: new Date('2018-02-16T23:00:00.000Z'),
  open: 291.73446745076194,
  high: 319.0409707265645,
  low: 289.0641545014954,
  close: 297.797087273747,
  turnover: 107.9323754965302
}, {
  timestamp: new Date('2018-02-17T23:00:00.000Z'),
  open: 295.4308870745993,
  high: 312.42680039145824,
  low: 284.49406311782013,
  close: 300.0809394676522,
  turnover: 112.53876592316848
}, {
  timestamp: new Date('2018-02-18T23:00:00.000Z'),
  open: 277.74202111002774,
  high: 310.1303534730495,
  low: 259.2601139672982,
  close: 291.36980543222376,
  turnover: 126.6863036647815
}, {
  timestamp: new Date('2018-02-19T23:00:00.000Z'),
  open: 272.259855548539,
  high: 279.3156264482866,
  low: 252.6968259420511,
  close: 270.4519709937125,
  turnover: 35.55966998888926
}, {
  timestamp: new Date('2018-02-20T23:00:00.000Z'),
  open: 278.56084960204004,
  high: 291.759868745291,
  low: 262.7205378977364,
  close: 290.55097694021146,
  turnover: 86.12009787219657
}, {
  timestamp: new Date('2018-02-21T23:00:00.000Z'),
  open: 277.0718690121961,
  high: 296.5663545901873,
  low: 265.6399575300554,
  close: 265.6399575300554,
  turnover: 80.13850893294628
}, {
  timestamp: new Date('2018-02-22T23:00:00.000Z'),
  open: 294.23180133165863,
  high: 294.23180133165863,
  low: 264.22416200229304,
  close: 274.88002521059286,
  turnover: 115.87814534696575
}, {
  timestamp: new Date('2018-02-23T23:00:00.000Z'),
  open: 272.69076854955824,
  high: 296.83514433238247,
  low: 266.5381849161054,
  close: 270.0210579926933,
  turnover: 151.74199393007638
}, {
  timestamp: new Date('2018-02-24T23:00:00.000Z'),
  open: 287.24857172854075,
  high: 292.5874124306232,
  low: 263.46422165258,
  close: 275.76307069053297,
  turnover: 152.65509670716096
}, {
  timestamp: new Date('2018-02-25T23:00:00.000Z'),
  open: 300.29092578111795,
  high: 314.8999368964302,
  low: 280.2386321792106,
  close: 289.12071663795575,
  turnover: 36.74553519138457
}, {
  timestamp: new Date('2018-02-26T23:00:00.000Z'),
  open: 315.3460921990977,
  high: 323.1616414055094,
  low: 287.9058027890874,
  close: 300.46555021997597,
  turnover: 168.26435897579915
}, {
  timestamp: new Date('2018-02-27T23:00:00.000Z'),
  open: 319.42563081066925,
  high: 325.4627949163547,
  low: 319.42563081066925,
  close: 322.7860116084044,
  turnover: 170.10457231946398
}, {
  timestamp: new Date('2018-02-28T23:00:00.000Z'),
  open: 300.3837675486831,
  high: 334.65431904641326,
  low: 291.61801760028686,
  close: 315.42787487039055,
  turnover: 117.86965991684345
}, {
  timestamp: new Date('2018-03-01T23:00:00.000Z'),
  open: 289.238940949737,
  high: 315.55682737906886,
  low: 289.238940949737,
  close: 300.1727014693367,
  turnover: 139.9354801111189
}, {
  timestamp: new Date('2018-03-02T23:00:00.000Z'),
  open: 295.4816126118915,
  high: 310.65155780271436,
  low: 282.47784678918697,
  close: 310.65155780271436,
  turnover: 122.10117132411916
}, {
  timestamp: new Date('2018-03-03T23:00:00.000Z'),
  open: 296.11363321829896,
  high: 317.26831004437446,
  low: 272.8069357791002,
  close: 283.6195371963069,
  turnover: 179.43404312601098
}, {
  timestamp: new Date('2018-03-04T23:00:00.000Z'),
  open: 269.0624503388819,
  high: 298.1607235575455,
  low: 250.45610668370728,
  close: 284.270720075724,
  turnover: 131.494227217255
}, {
  timestamp: new Date('2018-03-05T23:00:00.000Z'),
  open: 271.345722242146,
  high: 293.1022683363614,
  low: 252.84626528872246,
  close: 277.67705530260065,
  turnover: 30.09445680142917
}, {
  timestamp: new Date('2018-03-06T23:00:00.000Z'),
  open: 256.4971031417786,
  high: 284.8753237392135,
  low: 253.55660696584556,
  close: 266.12567440296806,
  turnover: 103.05923156185314
}, {
  timestamp: new Date('2018-03-07T23:00:00.000Z'),
  open: 248.12430323022744,
  high: 270.2582135507589,
  low: 240.44878827156785,
  close: 259.2379486323402,
  turnover: 74.89696844808942
}, {
  timestamp: new Date('2018-03-08T23:00:00.000Z'),
  open: 269.24909633684814,
  high: 269.24909633684814,
  low: 258.75763077933664,
  close: 264.51315552571947,
  turnover: 17.851425246175083
}];
