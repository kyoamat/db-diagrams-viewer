<script setup lang="ts">
import { computed, ref } from 'vue'
import Diagram from './components/Diagram.vue'

interface Table {
  name: string
  columns: Column[]
  constraints: Constraint[]
}

interface Column {
  Field: string
  Type: string
  Null: string
  Key: string
  Default: string
  Extra: string
}

interface Constraint {
  COLUMN_NAME: string
  CONSTRAINT_NAME: string
  REFERENCED_TABLE_NAME: string
  REFERENCED_COLUMN_NAME: string
}

const { mysql } = window

const isLoading = ref(false)
const connStr = ref('')
const src = ref('')

const buttonClass = computed(() => (isLoading.value ? 'button is-loading' : 'button'))

const handleSubmit = async () => {
  try {
    isLoading.value = true
    const res = await fetchTables(connStr.value)
    src.value = createMermaidSrc(res)
  } catch (e) {
    alert(e)
  } finally {
    isLoading.value = false
  }
}

const fetchTables = async (connStr: string) => {
  const client = mysql.createConnection(connStr)

  const showTablesRes = (await client.query('show tables;')) as any[][]

  if (showTablesRes.length < 2) {
    return []
  }

  const tables = showTablesRes[0].map((el) => Object.values(el)[0]) as string[]

  const result = [] as Table[]
  for (const table of tables) {
    const showColumnsRes = (await client.query(`show columns from \`${table}\`;`)) as any[][] // quoteされると動作しないのでplaceholderは利用しない

    const columns = [] as Column[]
    if (showColumnsRes.length > 1) {
      columns.push(...(showColumnsRes[0] as Column[]))
    }

    const showConstraintsRes = (await client.query(
      "select column_name, constraint_name, referenced_table_name, referenced_column_name from information_schema.key_column_usage where table_name = ? and not constraint_name = 'primary';",
      [table]
    )) as any[][] // PK制約はColumn定義からわかるので除く

    const constraints = [] as Constraint[]
    if (showConstraintsRes.length > 1) {
      constraints.push(...(showConstraintsRes[0] as Constraint[]))
    }

    result.push({
      name: table,
      columns,
      constraints
    })
  }

  return result
}

const createMermaidSrc = (tables: Table[]) => {
  let srcTxt = 'classDiagram'
  for (const table of tables) {
    srcTxt += `\n  class ${table.name} {\n`
    for (const column of table.columns) {
      srcTxt += `    ${column.Null === 'NO' ? '*' : ''}${column.Field}: ${column.Type.replace(
        '(',
        '<'
      ).replace(')', '>')} ${column.Key === 'PRI' ? '[PK]' : ''}\n` // カッコはメソッドとみなされるため変換している
    }
    srcTxt += '  }\n'
    for (const constraint of table.constraints) {
      if (constraint.REFERENCED_TABLE_NAME) {
        srcTxt += `${constraint.REFERENCED_TABLE_NAME} <|-- ${table.name}\n`
      }
    }
    srcTxt += '\n'
  }

  return srcTxt
}
</script>

<template>
  <div class="mx-3">
    <div class="my-2">DB Diagrams Viewer</div>
    <input v-model="connStr" class="input my-2" type="text" placeholder="Connection String" />
    <button :class="buttonClass" @click="handleSubmit">Submit</button>
    <div style="overflow: hidden">
      <Diagram v-if="!isLoading" ref="diagram" :src="src" />
    </div>
  </div>
</template>

<style scoped>
@import 'bulma/css/bulma.css';
</style>
