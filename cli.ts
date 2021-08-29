import * as fs from 'fs'
import * as path from 'path'
import * as csv from 'fast-csv'

interface CsvInputRow {
  id: number
  json: string
}

type CsvOutputRow = [number, string, boolean]

const toMatrix = (arr, width) =>
  arr.reduce(
    (rows, key, index) =>
      (index % width == 0
        ? rows.push([key])
        : rows[rows.length - 1].push(key)) && rows,
    []
  )

function rotate(
  matrix: number[],
  top: number,
  left: number,
  bottom: number,
  right: number
) {
  let elem = matrix[top][left]
  // downwards left side
  for (let y = top; y < bottom; y++) {
    matrix[y][left] = matrix[y + 1][left]
  }
  // righwards bottom
  for (let x = left; x < right; x++) {
    matrix[bottom][x] = matrix[bottom][x + 1]
  }
  // upwards right side
  for (let y = bottom; y > top; y--) {
    matrix[y][right] = matrix[y - 1][right]
  }
  // leftwards top
  for (let x = right; x > left + 1; x--) {
    matrix[top][x] = matrix[top][x - 1]
  }
  matrix.length === 1 ? elem : (matrix[top][left + 1] = elem)
}

export function rotateMatrix(input: [number, string]): CsvOutputRow {
  let [id, json] = input
  let jsonArray = json.substring(1, json.length - 1).split(', ')
  // only natural number of the square root of the input array length are valid
  let isValid = Math.sqrt(jsonArray.length) % 1 === 0

  if (isValid) {
    const matrix = toMatrix(jsonArray, Math.sqrt(jsonArray.length))
    const squareRoot = Math.sqrt(jsonArray.length)
    for (
      let i = squareRoot, j = 0, k = squareRoot;
      i > 0;
      i = i - 2, j++, k--
    ) {
      // TODO: return CsvOutputRow from function rotate
      rotate(matrix, j, j, k - 1, k - 1)
      return [id, `[${matrix}]`, true]
    }
  } else {
    return [id, '[]', false]
  }
}

const [filename] = process.argv.slice(2)

if (filename) {
  fs.createReadStream(path.resolve(__dirname, filename))
    .pipe(csv.parse({ headers: true }))
    .pipe(
      csv.format<CsvInputRow, CsvOutputRow>({
        headers: ['id', 'json', 'is_valid']
      })
    )
    .transform((row, next): void => {
      return next(null, rotateMatrix([row.id, row.json]))
    })
    .pipe(process.stdout)
    .on('end', () => process.exit())
} else {
  console.log('Filename is missing')
}
