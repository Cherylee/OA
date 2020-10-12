<template>
  <div class="app-container">
    <el-form
      :model="queryParams"
      ref="queryForm"
      :inline="true"
      v-show="showSearch"
      label-width="100px"
    >
      <el-form-item label="平台用户id" prop="platformUserId">
        <el-input
          v-model="queryParams.platformUserId"
          placeholder="请输入平台用户id"
          clearable
          size="small"
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="子系统id" prop="subosId">
        <el-input
          v-model="queryParams.subosId"
          placeholder="请输入子系统id"
          clearable
          size="small"
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item>
        <el-button type="cyan" icon="el-icon-search" size="mini" @click="handleQuery">搜索</el-button>
        <el-button icon="el-icon-refresh" size="mini" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button
          type="primary"
          icon="el-icon-plus"
          size="mini"
          @click="handleAdd"
          v-hasPermi="['system:sub:add']"
        >新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="success"
          icon="el-icon-edit"
          size="mini"
          :disabled="single"
          @click="handleUpdate"
          v-hasPermi="['system:sub:edit']"
        >修改</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="danger"
          icon="el-icon-delete"
          size="mini"
          :disabled="multiple"
          @click="handleDelete"
          v-hasPermi="['system:sub:remove']"
        >删除</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="warning"
          icon="el-icon-download"
          size="mini"
          @click="handleExport"
          v-hasPermi="['system:sub:export']"
        >导出</el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="subList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="平台用户id" align="center" prop="platformUserId" />
      <el-table-column label="子系统id" align="center" prop="subosId" />
      <el-table-column label="子系统用户id" align="center" prop="subosUserId" />
      <el-table-column label="子系统用户名" align="center" prop="subosUserName" />
      <el-table-column label="备注" align="center" prop="remark" />
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
        <template slot-scope="scope">
          <el-button
            size="mini"
            type="text"
            icon="el-icon-edit"
            @click="handleUpdate(scope.row)"
            v-hasPermi="['system:sub:edit']"
          >修改</el-button>
          <el-button
            size="mini"
            type="text"
            icon="el-icon-delete"
            @click="handleDelete(scope.row)"
            v-hasPermi="['system:sub:remove']"
          >删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination
      v-show="total>0"
      :total="total"
      :page.sync="queryParams.pageNum"
      :limit.sync="queryParams.pageSize"
      @pagination="getList"
    />

    <!-- 添加或修改平台用户与子系统用户关联对话框 -->
    <el-dialog :title="title" :visible.sync="open" width="500px" append-to-body>
      <el-form ref="form" :model="form" :rules="rules" label-width="110px">
        <el-form-item label="平台用户id" prop="platformUserId">
          <el-input
            @focus="openM('openUserDialog')"
            v-model="form.platformUserId"
            placeholder="请输入平台用户id"
          />
        </el-form-item>
        <el-form-item label="子系统id" prop="subosId">
          <el-input @focus="openM('openMenuDialog')" v-model="form.subosId" placeholder="请输入子系统id" />
        </el-form-item>
        <el-form-item label="子系统用户id" prop="subosUserId">
          <el-input v-model="form.subosUserId" placeholder="请输入子系统用户id" />
        </el-form-item>
        <el-form-item label="子系统用户名" prop="subosUserName">
          <el-input v-model="form.subosUserName" placeholder="请输入子系统用户名" />
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="form.remark" type="textarea" placeholder="请输入内容" />
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" @click="submitForm">确 定</el-button>
        <el-button @click="cancel">取 消</el-button>
      </div>
    </el-dialog>
    <!-- 用户弹出框组件 -->
    <el-dialog title="用户管理" :visible.sync="openUserDialog" width="1200px" append-to-body>
      <user-dialog @selectData="selectUserData" @cancelM="openM"></user-dialog>
    </el-dialog>
    <!--菜单弹出框组件 -->
    <el-dialog title="菜单管理" :visible.sync="openMenuDialog" width="1200px" append-to-body>
      <menu-dialog @selectData="selectMenuData" @cancelM="openM"></menu-dialog>
    </el-dialog>
  </div>
</template>

<script>
import { listSub, getSub, delSub, addSub, updateSub } from "@/api/system/sub";
import userDialog from "@/components/UserDialog";
import menuDialog from "@/components/MenuDialog";

export default {
  name: "Sub",
  components: {
    userDialog,
    menuDialog,
  },
  data() {
    return {
      // 遮罩层
      loading: true,
      // 选中数组
      ids: [],
      // 非单个禁用
      single: true,
      // 非多个禁用
      multiple: true,
      // 显示搜索条件
      showSearch: true,
      // 总条数
      total: 0,
      // 平台用户与子系统用户关联表格数据
      subList: [],
      // 弹出层标题
      title: "",
      // 是否显示弹出层
      open: false,
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        platformUserId: null,
        subosId: null,
        subosUserId: null,
        subosUserName: null,
      },
      // 表单参数
      form: {},
      // 表单校验
      rules: {
        platformUserId: [
          { required: true, message: "平台用户id不能为空", trigger: "blur" },
        ],
        subosId: [
          { required: true, message: "子系统id不能为空", trigger: "blur" },
        ],
        subosUserId: [
          { required: true, message: "子系统用户id不能为空", trigger: "blur" },
        ],
        subosUserName: [
          { required: true, message: "子系统用户名不能为空", trigger: "blur" },
        ],
      },
      // 用户显示弹窗
      openUserDialog: false,
      // 点击确定以后确认的选中user对象
      userObj: {},
      // 菜单显示弹窗
      openMenuDialog: false,
      // 菜单对象
      menuObj:{}
    };
  },
  created() {
    this.getList();
  },
  methods: {
    // 用户组件回调
    selectUserData(res) {
      this.userObj = res[0];
      this.form.platformUserId=res[0].userId
    },
    // 菜单组件回调
    selectMenuData(res) {
      this.menuObj = res[0];
      this.form.subosId=res[0].menuId
    },
    // 弹出框 显示隐藏
    openM(dialog) {
      //dialog对应的弹出层
      this[dialog] = !this[dialog];
    },
    /** 查询平台用户与子系统用户关联列表 */
    getList() {
      this.loading = true;
      listSub(this.queryParams).then((response) => {
        this.subList = response.rows;
        this.total = response.total;
        this.loading = false;
      });
    },
    // 取消按钮
    cancel() {
      this.open = false;
      this.reset();
    },
    // 表单重置
    reset() {
      this.form = {
        id: null,
        platformUserId: null,
        subosId: null,
        subosUserId: null,
        subosUserName: null,
        createTime: null,
        createBy: null,
        updateTime: null,
        updateBy: null,
        remark: null,
      };
      this.resetForm("form");
    },
    /** 搜索按钮操作 */
    handleQuery() {
      this.queryParams.pageNum = 1;
      this.getList();
    },
    /** 重置按钮操作 */
    resetQuery() {
      this.resetForm("queryForm");
      this.handleQuery();
    },
    // 多选框选中数据
    handleSelectionChange(selection) {
      this.ids = selection.map((item) => item.id);
      this.single = selection.length !== 1;
      this.multiple = !selection.length;
    },
    /** 新增按钮操作 */
    handleAdd() {
      this.reset();
      this.open = true;
      this.title = "添加平台用户与子系统用户关联";
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset();
      const id = row.id || this.ids;
      getSub(id).then((response) => {
        this.form = response.data;
        this.open = true;
        this.title = "修改平台用户与子系统用户关联";
      });
    },
    /** 提交按钮 */
    submitForm() {
      this.$refs["form"].validate((valid) => {
        if (valid) {
          if (this.form.id != null) {
            updateSub(this.form).then((response) => {
              if (response.code === 200) {
                this.msgSuccess("修改成功");
                this.open = false;
                this.getList();
              }
            });
          } else {
            addSub(this.form).then((response) => {
              if (response.code === 200) {
                this.msgSuccess("新增成功");
                this.open = false;
                this.getList();
              }
            });
          }
        }
      });
    },
    /** 删除按钮操作 */
    handleDelete(row) {
      const ids = row.id || this.ids;
      this.$confirm(
        '是否确认删除平台用户与子系统用户关联编号为"' + ids + '"的数据项?',
        "警告",
        {
          confirmButtonText: "确定",
          cancelButtonText: "取消",
          type: "warning",
        }
      )
        .then(function () {
          return delSub(ids);
        })
        .then(() => {
          this.getList();
          this.msgSuccess("删除成功");
        })
        .catch(function () {});
    },
    /** 导出按钮操作 */
    handleExport() {
      this.download(
        "system/sub/export",
        {
          ...this.queryParams,
        },
        `system_sub.xlsx`
      );
    },
  },
};
</script>