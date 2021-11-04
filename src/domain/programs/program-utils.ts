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

export async function getJsonHttp<O>(url: string): Promise<O> {
  const result = await fetch(url, {
    method: 'GET',
  });

  const outputData = await readResponseData(result);

  if (result.status >= 400) {
    throw new JsonError(result.status, outputData);
  }

  return outputData as O;
}

export async function postJsonHttp<I, O>(url: string, data: I): Promise<O> {
  const result = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
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
