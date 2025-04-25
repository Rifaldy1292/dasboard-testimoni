Diketahui himpunan-himpunan berikut:

A={2,4,6,8,10,12,14,16}
B={3,6,9,12,15,18,21}
C={5,10,15,20,25,30}

Pertanyaan:

1.  Tentukan hasil dari:
    a. A∪B
    b. A∩B
    c. A−B
    d. B∩C
    e. (A∪C)−B

2.  Tentukan banyaknya anggota dari:
    a. A×B
    b. (A−C)×(B∩C)

3.  Apakah benar (A∩B)∪(B∩C)=B∩(A∪C)? Berikan pembuktian atau bantah dengan menggunakan perhitungan himpunan.

4.  Jelaskan sifat-sifat operasi himpunan yang terlibat dalam hasil perhitungan Anda.

JAWABAN
Note: tanda // adalah komentar, penjelasan nomor 2 & 3 ada di bawah, mohon maaf saya menggunakan kode javascript

1.  A∪B={2,3,4,6,8,9,10,12,14,15,16,18,21} // combine A & B
    A∩B={6,12} // A === B (irisan)
    A−B={2,4,8,10,14,16} // A !== B (selisih)
    B∩C={15} // B === C (irisan)
    (A∪C)−B={2,4,6,8,10,12,14,16,20,25,30} // (combine A & C) !== B (selisih)

2.  A×B
    A.length = 8
    B.length = 7
    result = A.length x B.length = 56

(A−C)×(B∩C)
ASelisihC = {2,4,6,8,10,12,14,16}
BIrisanC = {15}
(ASelisihC.length x BIrisanC.length) = 8 dikali 1 = 8

3. Jawabannya ya

code:

```js
const A = [2, 4, 6, 8, 10, 12, 14, 16]
const B = [3, 6, 9, 12, 15, 18, 21]
const C = [5, 10, 15, 20, 25, 30]

// 2a
const totalAndB = A.length * B.length
console.log('**2a', { totalAndB }, '2a**')

// 2b
const ANotIncludesC = A.filter((item) => !C.includes(item))
const BIncludesC = B.filter((item) => C.includes(item))
const result2b = ANotIncludesC.length * BIncludesC.length
console.log('**2b', { ANotIncludesC, BIncludesC, result2b }, '2b**')

// 3 (A∩B)∪(B∩C)=B∩(A∪C)
const AIncludesB = A.filter((item) => B.includes(item)) // A∩B
const BIncludesC2 = B.filter((item) => C.includes(item)) // B∩C
const CombineAIncludesBWithBIncludesC2 = [...new Set([...AIncludesB, ...BIncludesC2])] // (A∩B)∪(B∩C)
const AUnionC = [...new Set([...A, ...C])] // A∪C, method Set for unique value
const BIncludesAUnionC = B.filter((item) => AUnionC.includes(item)) // B∩(A∪C)
const result3 =
  JSON.stringify(CombineAIncludesBWithBIncludesC2) === JSON.stringify(BIncludesAUnionC)
console.log(
  '**3',
  { AIncludesB, BIncludesC2, CombineAIncludesBWithBIncludesC2, AUnionC, BIncludesAUnionC, result3 },
  '3**'
)
```

log output:

```bash
node test.js
**2a { totalAndB: 56 } 2a**
**2b {
  ANotIncludesC: [
     2,  4,  6, 8,
    12, 14, 16
  ],
  BIncludesC: [ 15 ],
  result2b: 7
} 2b**
**3 {
  AIncludesB: [ 6, 12 ],
  BIncludesC2: [ 15 ],
  CombineAIncludesBWithBIncludesC2: [ 6, 12, 15 ],
  AUnionC: [
     2,  4, 6,  8, 10, 12,
    14, 16, 5, 15, 20, 25,
    30
  ],
  BIncludesAUnionC: [ 6, 12, 15 ],
  result3: true
} 3**
```

4. Sifat-sifat operasi himpunan yang terlibat dalam hasil perhitungan Anda adalah:

- gabungan: contoh A∪B(combine A & B without duplicate)
- irisan: contoh A∩B(filter A & B that have same value)
- selisih: contoh A−B(filter A yang tidak ada didalam B)
- perkalian: contoh A×B(combine A & B with multiply)
