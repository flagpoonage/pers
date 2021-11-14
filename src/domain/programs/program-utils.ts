const hexRegex = /^#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})$/;

// const rgbRegex = /^rgb\(\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*\)$/;

export const WebColors = [
  'aliceblue',
  'antiquewhite',
  'aqua',
  'aquamarine',
  'azure',
  'beige',
  'bisque',
  'black',
  'blanchedalmond',
  'blue',
  'blueviolet',
  'brown',
  'burlywood',
  'cadetblue',
  'chartreuse',
  'chocolate',
  'coral',
  'cornflowerblue',
  'cornsilk',
  'crimson',
  'cyan',
  'darkblue',
  'darkcyan',
  'darkgoldenrod',
  'darkgray',
  'darkgrey',
  'darkgreen',
  'darkkhaki',
  'darkmagenta',
  'darkolivegreen',
  'darkorange',
  'darkorchid',
  'darkred',
  'darksalmon',
  'darkseagreen',
  'darkslateblue',
  'darkslategray',
  'darkslategrey',
  'darkturquoise',
  'darkviolet',
  'deeppink',
  'deepskyblue',
  'dimgray',
  'dimgrey',
  'dodgerblue',
  'firebrick',
  'floralwhite',
  'forestgreen',
  'fuchsia',
  'gainsboro',
  'ghostwhite',
  'gold',
  'goldenrod',
  'gray',
  'grey',
  'green',
  'greenyellow',
  'honeydew',
  'hotpink',
  'indianred ',
  'indigo  ',
  'ivory',
  'khaki',
  'lavender',
  'lavenderblush',
  'lawngreen',
  'lemonchiffon',
  'lightblue',
  'lightcoral',
  'lightcyan',
  'lightgoldenrodyellow',
  'lightgray',
  'lightgrey',
  'lightgreen',
  'lightpink',
  'lightsalmon',
  'lightseagreen',
  'lightskyblue',
  'lightslategray',
  'lightslategrey',
  'lightsteelblue',
  'lightyellow',
  'lime',
  'limegreen',
  'linen',
  'magenta',
  'maroon',
  'mediumaquamarine',
  'mediumblue',
  'mediumorchid',
  'mediumpurple',
  'mediumseagreen',
  'mediumslateblue',
  'mediumspringgreen',
  'mediumturquoise',
  'mediumvioletred',
  'midnightblue',
  'mintcream',
  'mistyrose',
  'moccasin',
  'navajowhite',
  'navy',
  'oldlace',
  'olive',
  'olivedrab',
  'orange',
  'orangered',
  'orchid',
  'palegoldenrod',
  'palegreen',
  'paleturquoise',
  'palevioletred',
  'papayawhip',
  'peachpuff',
  'peru',
  'pink',
  'plum',
  'powderblue',
  'purple',
  'rebeccapurple',
  'red',
  'rosybrown',
  'royalblue',
  'saddlebrown',
  'salmon',
  'sandybrown',
  'seagreen',
  'seashell',
  'sienna',
  'silver',
  'skyblue',
  'slateblue',
  'slategray',
  'slategrey',
  'snow',
  'springgreen',
  'steelblue',
  'tan',
  'teal',
  'thistle',
  'tomato',
  'turquoise',
  'violet',
  'wheat',
  'white',
  'whitesmoke',
  'yellow',
  'yellowgreen',
];

export type RGB = { r: number; g: number; b: number };
export type HSL = { h: number; s: number; l: number };
export type HEX = { r: string; g: string; b: string };

export function getRandomColor(output: 'hsl' | 'rgb' | 'hex') {
  const hsl_color = { h: Math.floor(Math.random() * 359), s: 50, l: 50 };

  if (output === 'hsl') {
    return `hsl(${hsl_color.h},${hsl_color.s},${hsl_color.l})`;
  }

  const rgb_color = convertHslToRgb(hsl_color);

  if (output === 'rgb') {
    return `hsl(${hsl_color.h},${hsl_color.s},${hsl_color.l})`;
  }

  const hex_color = convertRgbToHex(rgb_color);

  return `#${hex_color.r}${hex_color.g}${hex_color.b}`;
}

export function convertRgbToHex(rgb_color: RGB): HEX {
  return {
    r: rgb_color.r.toString(16),
    g: rgb_color.g.toString(16),
    b: rgb_color.b.toString(16),
  };
}

// From: https://stackoverflow.com/a/9493060/845704
export function convertHslToRgb(hsl_color: HSL): RGB {
  const { l: lightness, h: hue, s: saturation } = hsl_color;

  let red = 0,
    green = 0,
    blue = 0;

  if (hsl_color.s === 0) {
    red = green = blue = lightness; // achromatic
  } else {
    const hue2rgb = function hue2rgb(p: number, q: number, t: number) {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q =
      hsl_color.l < 0.5
        ? hsl_color.l * (1 + saturation)
        : hsl_color.l + saturation - hsl_color.l * saturation;
    const p = 2 * hsl_color.l - q;
    red = hue2rgb(p, q, hue + 1 / 3);
    green = hue2rgb(p, q, hue);
    blue = hue2rgb(p, q, hue - 1 / 3);
  }

  return {
    r: Math.round(red * 255),
    g: Math.round(green * 255),
    b: Math.round(blue * 255),
  };
}

export function isValidColor(color: string) {
  if (WebColors.includes(color.toLowerCase())) {
    return true;
  }

  if (hexRegex.test(color)) {
    return true;
  }

  return false;
}

export interface PostJsonErrorRepsonse {
  type: string;
  data: {
    message: string;
    details: string[];
  };
}
export class JsonError extends Error {
  status: number;
  data: PostJsonErrorRepsonse | string | null;

  constructor(status: number, data: PostJsonErrorRepsonse | string | null) {
    super('Error making POST json request');

    this.status = status;
    this.data = data;
  }
}

export async function readResponseData(response: Response) {
  try {
    return await response.json();
  } catch {
    console.warn('Non-json response');
  }

  try {
    return await response.text();
  } catch {
    console.warn('Non-text response');
  }

  return null;
}

export function makeHeaders(authToken?: string): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  return headers;
}

export async function getJsonHttp<O>(
  url: string,
  authToken?: string
): Promise<O> {
  const result = await fetch(url, {
    method: 'GET',
    headers: makeHeaders(authToken),
  });

  const outputData = await readResponseData(result);

  if (result.status >= 400) {
    throw new JsonError(result.status, outputData);
  }

  return outputData as O;
}

export async function postJsonHttp<I, O>(
  url: string,
  data: I,
  authToken?: string
): Promise<O> {
  const result = await fetch(url, {
    method: 'POST',
    headers: makeHeaders(authToken),
    body: JSON.stringify(data),
  });

  const outputData = await readResponseData(result);

  if (result.status >= 400) {
    throw new JsonError(result.status, outputData);
  }

  return outputData as O;
}

export function getJsonErrorMessage(error: JsonError): string {
  if (error.status >= 500) {
    return `[${
      error.status
    }] An internal error occurred on the API\n\nData: ${JSON.stringify(
      error.data
    )}`;
  } else if (error.status >= 400) {
    if (error.data === null) {
      return `[${error.status}] An unkown client error occurred. No response data is available`;
    }
    if (typeof error.data === 'string') {
      return `[${error.status}] An unkown client error occurred.\n\nData: ${error.data}`;
    }

    const base_message = `[${error.status}] ${error.data.data.message}`;

    if (error.data.data.details.length === 0) {
      return base_message;
    }

    return `${base_message}\n\nDetails:\n\n${error.data.data.details
      .map((a) => `- ${a}`)
      .join('\n')}`;
  }

  return `[${error.status}] An unexpected status was received`;
}
