
/**
 * Diketahui himpunan-himpunan berikut:

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

 */

const A = [2, 4, 6, 8, 10, 12, 14, 16];
const B = [3, 6, 9, 12, 15, 18, 21];
const C = [5, 10, 15, 20, 25, 30];

// 2a
const totalAndB = A.length * B.length;
console.log('**2a', { totalAndB }, '2a**');

// 2b
const ANotIncludesC = A.filter((item) => !C.includes(item));
const BIncludesC = B.filter((item) => C.includes(item));
const result2b = ANotIncludesC.length * BIncludesC.length;
console.log('**2b', { ANotIncludesC, BIncludesC, result2b }, '2b**');


// 3 (A∩B)∪(B∩C)=B∩(A∪C) 
const AIncludesB = A.filter((item) => B.includes(item)); // A∩B
const BIncludesC2 = B.filter((item) => C.includes(item)); // B∩C
const CombineAIncludesBWithBIncludesC2 = [...new Set([...AIncludesB, ...BIncludesC2])] // (A∩B)∪(B∩C)
const AUnionC = [...new Set([...A, ...C])]; // A∪C, method Set for unique value
const BIncludesAUnionC = B.filter((item) => AUnionC.includes(item)); // B∩(A∪C)
const result3 = JSON.stringify(CombineAIncludesBWithBIncludesC2) === JSON.stringify(BIncludesAUnionC);
console.log('**3', { AIncludesB, BIncludesC2, CombineAIncludesBWithBIncludesC2, AUnionC, BIncludesAUnionC, result3 }, '3**');
